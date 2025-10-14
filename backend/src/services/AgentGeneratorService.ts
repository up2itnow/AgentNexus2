/**
 * Agent Generator Service
 * 
 * Handles creation of custom agents from templates or modules
 * Supports all three build methods: Template, Hybrid, and Custom
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { PrismaClient, AgentCategory, AgentStatus, BuildMethod } from '@prisma/client';

const prisma = new PrismaClient();

interface GenerateAgentOptions {
  templateId?: string;
  buildMethod: BuildMethod;
  configuration: Record<string, any>;
  selectedModules?: string[];
  customCode?: string;
  name: string;
  description: string;
  category: AgentCategory;
  creatorId: string;
  developerWallet: string;
}

export class AgentGeneratorService {
  /**
   * Generate a new custom agent
   */
  async generateAgent(options: GenerateAgentOptions) {
    const {
      templateId,
      buildMethod,
      configuration,
      selectedModules,
      customCode,
      name,
      description,
      category,
      creatorId,
      developerWallet,
    } = options;

    // 1. Validate inputs
    await this.validateInputs(options);

    // 2. Calculate pricing based on complexity
    const price = await this.calculatePrice(buildMethod, selectedModules, templateId);

    // 3. Generate input/output schemas
    const { inputSchema, outputSchema } = await this.generateSchemas(
      buildMethod,
      templateId,
      selectedModules,
      configuration
    );

    // 4. Create the agent in database
    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        category,
        developer: creatorId, // User ID for custom agents
        developerWallet,
        price,
        dockerImage: this.getDockerImage(buildMethod, category),
        inputSchema,
        outputSchema,
        status: AgentStatus.UNDER_REVIEW, // Custom agents need review
      },
    });

    // 5. Create custom agent record
    const customAgent = await prisma.customAgent.create({
      data: {
        agentId: agent.id,
        templateId: templateId || null,
        creatorId,
        buildMethod,
        configuration,
        selectedModules: selectedModules || [],
        customCode: customCode || null,
        isPublic: false, // Start private until approved
        isDeployed: false,
      },
    });

    // 6. Update template usage count if applicable
    if (templateId) {
      await prisma.agentTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return {
      agent,
      customAgent,
      estimatedDeploymentTime: this.estimateDeploymentTime(buildMethod),
    };
  }

  /**
   * Validate inputs for agent generation
   */
  private async validateInputs(options: GenerateAgentOptions) {
    // Validate template if provided
    if (options.templateId) {
      const template = await prisma.agentTemplate.findUnique({
        where: { id: options.templateId },
      });
      if (!template || !template.isActive) {
        throw new Error('Invalid or inactive template');
      }
    }

    // Validate modules if provided
    if (options.selectedModules && options.selectedModules.length > 0) {
      const modules = await prisma.agentModule.findMany({
        where: {
          id: { in: options.selectedModules },
          isActive: true,
        },
      });
      if (modules.length !== options.selectedModules.length) {
        throw new Error('Some selected modules are invalid or inactive');
      }
    }

    // Validate build method requirements
    if (options.buildMethod === BuildMethod.TEMPLATE && !options.templateId) {
      throw new Error('Template ID required for template-based build');
    }

    if (options.buildMethod === BuildMethod.HYBRID && (!options.selectedModules || options.selectedModules.length === 0)) {
      throw new Error('Modules required for hybrid build');
    }

    if (options.buildMethod === BuildMethod.CUSTOM && !options.customCode) {
      throw new Error('Custom code required for custom build');
    }
  }

  /**
   * Calculate agent price based on complexity
   */
  private async calculatePrice(
    buildMethod: BuildMethod,
    moduleIds?: string[],
    templateId?: string
  ): Promise<number> {
    let basePrice = 2.0; // Base price for all custom agents

    // Template-based: use template price
    if (buildMethod === BuildMethod.TEMPLATE && templateId) {
      const template = await prisma.agentTemplate.findUnique({
        where: { id: templateId },
      });
      return template ? parseFloat(template.basePrice.toString()) : basePrice;
    }

    // Hybrid: calculate from modules
    if (buildMethod === BuildMethod.HYBRID && moduleIds) {
      const modules = await prisma.agentModule.findMany({
        where: { id: { in: moduleIds } },
      });
      
      const moduleCosts = modules.reduce((total, module) => {
        return total + parseFloat(module.baseCost.toString());
      }, 0);
      
      basePrice += moduleCosts;
      
      // Complexity multiplier (more modules = higher cost)
      if (modules.length > 5) {
        basePrice *= 1.2;
      }
      if (modules.length > 10) {
        basePrice *= 1.4;
      }
    }

    // Custom: premium pricing
    if (buildMethod === BuildMethod.CUSTOM) {
      basePrice = 10.0; // Premium for fully custom agents
    }

    return Math.round(basePrice * 100) / 100; // Round to 2 decimals
  }

  /**
   * Generate input and output schemas
   */
  private async generateSchemas(
    buildMethod: BuildMethod,
    templateId?: string,
    moduleIds?: string[],
    configuration?: Record<string, any>
  ): Promise<{ inputSchema: any; outputSchema: any }> {
    // Template-based: use template schemas
    if (buildMethod === BuildMethod.TEMPLATE && templateId) {
      const template = await prisma.agentTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        return {
          inputSchema: template.configSchema,
          outputSchema: this.generateOutputSchema(template.modules),
        };
      }
    }

    // Hybrid: combine module schemas
    if (buildMethod === BuildMethod.HYBRID && moduleIds) {
      const modules = await prisma.agentModule.findMany({
        where: { id: { in: moduleIds } },
      });
      
      const inputSchema = this.combineModuleSchemas(modules);
      const outputSchema = this.generateOutputSchemaFromModules(modules);
      
      return { inputSchema, outputSchema };
    }

    // Custom: generic schemas
    return {
      inputSchema: {
        type: 'object',
        properties: {
          parameters: {
            type: 'object',
            description: 'Custom agent parameters',
          },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: {
            type: 'object',
            description: 'Custom agent output',
          },
        },
      },
    };
  }

  /**
   * Combine multiple module schemas into one
   */
  private combineModuleSchemas(modules: any[]): any {
    const combinedProperties: any = {};
    const required: string[] = [];

    modules.forEach(module => {
      const schema = module.configSchema;
      if (schema.properties) {
        Object.assign(combinedProperties, schema.properties);
      }
      if (schema.required) {
        required.push(...schema.required);
      }
    });

    return {
      type: 'object',
      properties: combinedProperties,
      required: [...new Set(required)], // Remove duplicates
    };
  }

  /**
   * Generate output schema from modules
   */
  private generateOutputSchemaFromModules(modules: any[]): any {
    return {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['success', 'error'] },
        data: { type: 'object', description: 'Agent execution results' },
        timestamp: { type: 'string', format: 'date-time' },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              output: { type: 'object' },
            },
          },
        },
      },
    };
  }

  /**
   * Generate output schema from template modules
   */
  private generateOutputSchema(templateModules: any): any {
    return {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['success', 'error'] },
        result: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    };
  }

  /**
   * Get Docker image name based on build method and category
   */
  private getDockerImage(buildMethod: BuildMethod, category: AgentCategory): string {
    if (buildMethod === BuildMethod.CUSTOM) {
      return 'agentnexus/custom-agent:latest';
    }

    const categoryMap: Record<AgentCategory, string> = {
      [AgentCategory.TRADING]: 'agentnexus/trading-agent:latest',
      [AgentCategory.ANALYTICS]: 'agentnexus/analytics-agent:latest',
      [AgentCategory.DEFI]: 'agentnexus/defi-agent:latest',
      [AgentCategory.NFT]: 'agentnexus/nft-agent:latest',
      [AgentCategory.SOCIAL]: 'agentnexus/social-agent:latest',
      [AgentCategory.UTILITY]: 'agentnexus/utility-agent:latest',
      [AgentCategory.CUSTOM]: 'agentnexus/generic-agent:latest',
    };

    return categoryMap[category] || 'agentnexus/generic-agent:latest';
  }

  /**
   * Estimate deployment time in minutes
   */
  private estimateDeploymentTime(buildMethod: BuildMethod): number {
    const timeMap: Record<BuildMethod, number> = {
      [BuildMethod.TEMPLATE]: 5,
      [BuildMethod.HYBRID]: 10,
      [BuildMethod.CUSTOM]: 20,
    };
    return timeMap[buildMethod];
  }

  /**
   * Get all available templates
   */
  async getTemplates(difficulty?: string, category?: AgentCategory) {
    const where: any = { isActive: true };
    
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;

    return prisma.agentTemplate.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get all available modules
   */
  async getModules(category?: string) {
    const where: any = { isActive: true };
    
    if (category) where.category = category;

    return prisma.agentModule.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { difficulty: 'asc' },
      ],
    });
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string) {
    return prisma.agentTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * Get user's custom agents
   */
  async getUserCustomAgents(userId: string) {
    return prisma.customAgent.findMany({
      where: { creatorId: userId },
      include: {
        agent: true,
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update custom agent configuration
   */
  async updateCustomAgent(id: string, updates: Partial<GenerateAgentOptions>) {
    const customAgent = await prisma.customAgent.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!customAgent) {
      throw new Error('Custom agent not found');
    }

    // Update custom agent record
    if (updates.configuration || updates.selectedModules || updates.customCode) {
      await prisma.customAgent.update({
        where: { id },
        data: {
          configuration: updates.configuration || customAgent.configuration,
          selectedModules: updates.selectedModules || customAgent.selectedModules,
          customCode: updates.customCode || customAgent.customCode,
        },
      });
    }

    // Update agent record if needed
    if (updates.name || updates.description) {
      await prisma.agent.update({
        where: { id: customAgent.agentId },
        data: {
          name: updates.name || customAgent.agent.name,
          description: updates.description || customAgent.agent.description,
        },
      });
    }

    return this.getUserCustomAgents(customAgent.creatorId);
  }

  /**
   * Deploy custom agent to marketplace
   */
  async deployAgent(customAgentId: string) {
    const customAgent = await prisma.customAgent.findUnique({
      where: { id: customAgentId },
      include: { agent: true },
    });

    if (!customAgent) {
      throw new Error('Custom agent not found');
    }

    // Update statuses
    await Promise.all([
      prisma.customAgent.update({
        where: { id: customAgentId },
        data: {
          isDeployed: true,
          isPublic: true,
          deployedAt: new Date(),
        },
      }),
      prisma.agent.update({
        where: { id: customAgent.agentId },
        data: {
          status: AgentStatus.ACTIVE, // Make visible in marketplace
        },
      }),
    ]);

    return {
      success: true,
      message: 'Agent deployed to marketplace successfully',
      agentId: customAgent.agentId,
    };
  }
}

