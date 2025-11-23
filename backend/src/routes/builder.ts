/**
 * Agent Builder API Routes
 * 
 * Handles template listing, module management, and agent generation
 * Supports all three build methods
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { AgentGeneratorService } from '../services/AgentGeneratorService';
import { AgentCategory, BuildMethod } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
const generatorService = new AgentGeneratorService();

/**
 * GET /api/builder/templates
 * Get all available agent templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { difficulty, category } = req.query;

    const templates = await generatorService.getTemplates(
      difficulty as string,
      category as AgentCategory
    );

    res.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/builder/templates/:id
 * Get a single template by ID
 */
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await generatorService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    return res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({
      error: 'Failed to fetch template',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/builder/modules
 * Get all available agent modules
 */
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const modules = await generatorService.getModules(category as string);

    // Group modules by category for easier frontend use
    const groupedModules = modules.reduce((acc: any, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {});

    res.json({
      modules,
      grouped: groupedModules,
      total: modules.length,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      error: 'Failed to fetch modules',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/builder/generate
 * Generate a new custom agent
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
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
    } = req.body;

    // Validation
    if (!name || !description || !category || !creatorId || !developerWallet) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, description, category, creatorId, and developerWallet are required',
      });
    }

    if (!buildMethod || !Object.values(BuildMethod).includes(buildMethod)) {
      return res.status(400).json({
        error: 'Invalid build method',
        message: `Build method must be one of: ${Object.values(BuildMethod).join(', ')}`,
      });
    }

    // Generate the agent
    const result = await generatorService.generateAgent({
      templateId,
      buildMethod,
      configuration,
      selectedModules,
      customCode,
      name,
      description,
      category: category as AgentCategory,
      creatorId,
      developerWallet,
    });

    // Assuming result contains agent and imageTag properties
    return res.status(201).json({
      agentId: result.agent.id,
      dockerImage: result.agent.dockerImage,
      message: 'Agent generated successfully',
    });
  } catch (error) {
    console.error('Error generating agent:', error);
    return res.status(500).json({ error: 'Failed to generate agent' });
  }
});

/**
 * GET /api/builder/my-agents/:userId
 * Get all custom agents created by a user
 */
router.get('/my-agents/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const customAgents = await generatorService.getUserCustomAgents(userId);

    res.json({
      customAgents,
      total: customAgents.length,
    });
  } catch (error) {
    console.error('Error fetching user agents:', error);
    res.status(500).json({
      error: 'Failed to fetch user agents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/builder/agents/:id
 * Update a custom agent
 */
router.patch('/agents/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const agent = await generatorService.getCustomAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this agent' });
    }

    const customAgents = await generatorService.updateCustomAgent(id, updates);

    return res.json({
      success: true,
      message: 'Agent updated successfully',
      customAgents,
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return res.status(500).json({
      error: 'Failed to update agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/builder/agents/:id/deploy
 * Deploy a custom agent to the marketplace
 */
router.post('/agents/:id/deploy', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const agent = await generatorService.getCustomAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this agent' });
    }

    const result = await generatorService.deployAgent(id);

    return res.json(result);
  } catch (error) {
    console.error('Error deploying agent:', error);
    return res.status(500).json({
      error: 'Failed to deploy agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/builder/preview
 * Preview an agent configuration without creating it
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { templateId, buildMethod, selectedModules } = req.body;

    // Calculate estimated price
    const estimatedPrice = await (generatorService as any).calculatePrice(
      buildMethod as BuildMethod,
      selectedModules,
      templateId
    );

    // Get schemas
    const { inputSchema, outputSchema } = await (generatorService as any).generateSchemas(
      buildMethod as BuildMethod,
      templateId,
      selectedModules,
      {}
    );

    // Estimate deployment time
    const estimatedDeploymentTime = (generatorService as any).estimateDeploymentTime(
      buildMethod as BuildMethod
    );

    res.json({
      estimatedPrice,
      inputSchema,
      outputSchema,
      estimatedDeploymentTime,
    });
  } catch (error) {
    console.error('Error previewing agent:', error);
    res.status(500).json({
      error: 'Failed to preview agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

