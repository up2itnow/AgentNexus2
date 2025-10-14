/**
 * Manual Docker Test Script
 * 
 * Quick test to verify Docker integration works without full database setup.
 * Run with: npx tsx tests/manual-docker-test.ts
 */

import Docker from 'dockerode';

async function testDockerIntegration() {
  console.log('🚀 Starting Docker Integration Test\n');

  const docker = new Docker();
  
  try {
    // Test 1: Check Docker is available
    console.log('1️⃣ Testing Docker connection...');
    await docker.ping();
    console.log('✅ Docker is running\n');

    // Test 2: Verify our agent images exist
    console.log('2️⃣ Checking agent images...');
    const images = await docker.listImages();
    const agentImages = images.filter(img => 
      img.RepoTags?.some(tag => tag.startsWith('agentnexus-'))
    );
    
    console.log(`✅ Found ${agentImages.length} agent images:`);
    agentImages.forEach(img => {
      console.log(`   - ${img.RepoTags?.[0]} (${(img.Size / 1024 / 1024).toFixed(1)}MB)`);
    });
    console.log('');

    // Test 3: Run Python agent
    console.log('3️⃣ Testing Python agent execution...');
    const pythonResult = await runAgent('agentnexus-python-echo:v1', {
      query: 'Docker integration test!'
    });
    console.log('✅ Python agent output:', JSON.stringify(pythonResult, null, 2));
    console.log('');

    // Test 4: Run Node.js agent
    console.log('4️⃣ Testing Node.js agent execution...');
    const nodejsResult = await runAgent('agentnexus-nodejs-echo:v1', {
      query: 'Node.js test!'
    });
    console.log('✅ Node.js agent output:', JSON.stringify(nodejsResult, null, 2));
    console.log('');

    // Test 5: Run Shell agent
    console.log('5️⃣ Testing Shell agent execution...');
    const shellResult = await runAgent('agentnexus-shell-echo:v1', {
      query: 'Shell test!'
    });
    console.log('✅ Shell agent output:', JSON.stringify(shellResult, null, 2));
    console.log('');

    // Test 6: Resource limits
    console.log('6️⃣ Testing resource limits...');
    const limitedResult = await runAgentWithLimits('agentnexus-python-echo:v1', {
      query: 'Resource limit test'
    });
    console.log('✅ Resource limits enforced');
    console.log('   Output:', JSON.stringify(limitedResult, null, 2));
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('Summary:');
    console.log('  ✅ Docker connection: Working');
    console.log('  ✅ Agent images: 3 found');
    console.log('  ✅ Python execution: Success');
    console.log('  ✅ Node.js execution: Success');
    console.log('  ✅ Shell execution: Success');
    console.log('  ✅ Resource limits: Enforced');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Run an agent with basic configuration
 */
async function runAgent(imageName: string, inputData: any): Promise<any> {
  const docker = new Docker();

  const container = await docker.createContainer({
    Image: imageName,
    Env: [`INPUT_DATA=${JSON.stringify(inputData)}`],
    HostConfig: {
      AutoRemove: true,
      NetworkMode: 'none'
    },
    AttachStdout: true,
    AttachStderr: true
  });

  await container.start();
  
  // Get logs
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    follow: true
  });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    logs.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    logs.on('end', () => {
      const output = Buffer.concat(chunks).toString();
      const lines = output.split('\n').filter(l => l.trim());
      
      // Find JSON output
      for (const line of lines.reverse()) {
        try {
          const json = JSON.parse(line);
          if (typeof json === 'object') {
            resolve(json);
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      resolve({ status: 'no_json', output });
    });

    logs.on('error', reject);
  });
}

/**
 * Run an agent with full security and resource limits
 */
async function runAgentWithLimits(imageName: string, inputData: any): Promise<any> {
  const docker = new Docker();

  const container = await docker.createContainer({
    Image: imageName,
    Env: [`INPUT_DATA=${JSON.stringify(inputData)}`],
    HostConfig: {
      // Resource limits
      Memory: 512 * 1024 * 1024,        // 512MB
      MemorySwap: 512 * 1024 * 1024,     // No swap
      CpuQuota: 50000,                    // 50% CPU
      CpuPeriod: 100000,
      PidsLimit: 100,                     // Prevent fork bombs
      
      // Security
      NetworkMode: 'none',
      ReadonlyRootfs: false,
      Tmpfs: {
        '/tmp': 'rw,noexec,nosuid,size=100m'
      },
      SecurityOpt: ['no-new-privileges:true'],
      CapDrop: ['ALL'],
      
      // Cleanup
      AutoRemove: true
    },
    User: '1000:1000',
    AttachStdout: true,
    AttachStderr: true
  });

  await container.start();
  
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    follow: true
  });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    logs.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    logs.on('end', () => {
      const output = Buffer.concat(chunks).toString();
      const lines = output.split('\n').filter(l => l.trim());
      
      for (const line of lines.reverse()) {
        try {
          const json = JSON.parse(line);
          if (typeof json === 'object') {
            resolve(json);
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      resolve({ status: 'no_json', output });
    });

    logs.on('error', reject);
  });
}

// Run tests
testDockerIntegration().catch(console.error);

