// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title A2APaymentProtocol
 * @notice Agent-to-Agent Payment Protocol for multi-agent pipeline execution
 * @dev Full-featured pipeline with parallel execution, conditional branching, and retries
 * 
 * Features:
 * - Create pipelines with multiple agents and payment splits
 * - Parallel execution via stages (agents in same stage run concurrently)
 * - Conditional branching based on previous step results
 * - Automatic retry with configurable limits
 * - Refund mechanism for failed/cancelled pipelines
 * 
 * @author AgentNexus Team
 */
contract A2APaymentProtocol is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Roles ============
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");

    // ============ Enums ============
    enum PipelineStatus {
        Created,
        Funded,
        InProgress,
        Completed,
        Cancelled,
        Failed
    }
    
    enum StepStatus {
        Pending,
        Running,
        Completed,
        Failed,
        Skipped
    }

    // ============ Structs ============
    struct PipelineStep {
        uint256 agentId;
        address developer;      // Agent developer to receive payment
        uint256 paymentBps;     // Payment share in basis points (100 = 1%)
        uint256 stageIndex;     // Stage for parallel execution (same stage = parallel)
        uint256 maxRetries;     // Maximum retry attempts (0 = no retries)
        uint256 retryCount;     // Current retry count
        bytes32 conditionHash;  // keccak256 of required condition (0 = always run)
        StepStatus status;
    }
    
    struct PipelineStage {
        uint256 stepCount;      // Number of steps in this stage
        uint256 completedCount; // Completed steps in this stage
        bool allCompleted;      // True when all steps in stage are done
    }

    struct Pipeline {
        bytes32 id;
        address creator;
        address paymentToken;
        uint256 totalAmount;
        uint256 platformFeeBps;
        PipelineStatus status;
        uint256 currentStage;
        uint256 totalStages;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 timeout;        // Seconds before auto-fail (0 = no timeout)
    }

    // ============ State ============
    mapping(bytes32 => Pipeline) public pipelines;
    mapping(bytes32 => PipelineStep[]) public pipelineSteps;
    mapping(bytes32 => mapping(uint256 => PipelineStage)) public pipelineStages; // pipelineId => stageIndex => stage
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bytes32) public stepResults; // stepId => result hash (for conditions)
    
    address public platformFeeRecipient;
    uint256 public defaultPlatformFeeBps;
    uint256 public constant MAX_RETRIES = 5;

    // ============ Events ============
    event PipelineCreated(
        bytes32 indexed pipelineId,
        address indexed creator,
        uint256 stepCount,
        uint256 stageCount,
        address paymentToken
    );
    
    event PipelineFunded(
        bytes32 indexed pipelineId,
        uint256 amount,
        address paymentToken
    );
    
    event StepStarted(
        bytes32 indexed pipelineId,
        uint256 stepIndex,
        uint256 agentId,
        uint256 stageIndex
    );
    
    event StepCompleted(
        bytes32 indexed pipelineId,
        uint256 stepIndex,
        uint256 agentId,
        address developer,
        uint256 paymentAmount,
        bytes32 resultHash
    );
    
    event StepFailed(
        bytes32 indexed pipelineId,
        uint256 stepIndex,
        uint256 agentId,
        uint256 retryCount
    );
    
    event StepRetried(
        bytes32 indexed pipelineId,
        uint256 stepIndex,
        uint256 retryAttempt
    );
    
    event StepSkipped(
        bytes32 indexed pipelineId,
        uint256 stepIndex,
        string reason
    );
    
    event StageCompleted(
        bytes32 indexed pipelineId,
        uint256 stageIndex
    );
    
    event PipelineCompleted(bytes32 indexed pipelineId, uint256 totalPayouts);
    event PipelineCancelled(bytes32 indexed pipelineId, uint256 refundAmount);
    event PipelineFailed(bytes32 indexed pipelineId, uint256 stageIndex, uint256 stepIndex);

    // ============ Constructor ============
    constructor(address _platformFeeRecipient, uint256 _platformFeeBps) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeeBps <= 1000, "Fee too high"); // Max 10%
        
        platformFeeRecipient = _platformFeeRecipient;
        defaultPlatformFeeBps = _platformFeeBps;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }

    // ============ Pipeline Creation ============
    
    /**
     * @notice Create a new agent pipeline with parallel stages and conditions
     * @param agentIds Array of agent IDs
     * @param developers Array of developer addresses for each agent
     * @param paymentBps Array of payment percentages in basis points
     * @param stageIndices Array of stage indices (same stage = parallel execution)
     * @param maxRetries Array of max retry attempts per step
     * @param conditions Array of condition hashes (0 = always run)
     * @param paymentToken ERC20 token for payments
     * @param timeout Pipeline timeout in seconds (0 = no timeout)
     * @return pipelineId Unique pipeline identifier
     */
    function createPipeline(
        uint256[] calldata agentIds,
        address[] calldata developers,
        uint256[] calldata paymentBps,
        uint256[] calldata stageIndices,
        uint256[] calldata maxRetries,
        bytes32[] calldata conditions,
        address paymentToken,
        uint256 timeout
    ) external returns (bytes32 pipelineId) {
        require(agentIds.length > 0, "Empty pipeline");
        require(agentIds.length <= 20, "Max 20 steps");
        require(agentIds.length == developers.length, "Array mismatch");
        require(agentIds.length == paymentBps.length, "Array mismatch");
        require(agentIds.length == stageIndices.length, "Array mismatch");
        require(agentIds.length == maxRetries.length, "Array mismatch");
        require(agentIds.length == conditions.length, "Array mismatch");
        require(supportedTokens[paymentToken], "Token not supported");
        
        // Validate total payment splits = 100%
        uint256 totalBps;
        uint256 maxStage;
        for (uint256 i = 0; i < paymentBps.length; i++) {
            require(developers[i] != address(0), "Invalid developer");
            require(maxRetries[i] <= MAX_RETRIES, "Retry limit exceeded");
            totalBps += paymentBps[i];
            if (stageIndices[i] > maxStage) maxStage = stageIndices[i];
        }
        require(totalBps == 10000, "Splits must equal 100%");
        
        // Generate unique pipeline ID
        pipelineId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.number,
            agentIds[0]
        ));
        
        require(pipelines[pipelineId].createdAt == 0, "Pipeline exists");
        
        // Store pipeline
        pipelines[pipelineId] = Pipeline({
            id: pipelineId,
            creator: msg.sender,
            paymentToken: paymentToken,
            totalAmount: 0,
            platformFeeBps: defaultPlatformFeeBps,
            status: PipelineStatus.Created,
            currentStage: 0,
            totalStages: maxStage + 1,
            createdAt: block.timestamp,
            fundedAt: 0,
            timeout: timeout
        });
        
        // Store steps and count per stage
        for (uint256 i = 0; i < agentIds.length; i++) {
            pipelineSteps[pipelineId].push(PipelineStep({
                agentId: agentIds[i],
                developer: developers[i],
                paymentBps: paymentBps[i],
                stageIndex: stageIndices[i],
                maxRetries: maxRetries[i],
                retryCount: 0,
                conditionHash: conditions[i],
                status: StepStatus.Pending
            }));
            
            // Increment stage step count
            pipelineStages[pipelineId][stageIndices[i]].stepCount++;
        }
        
        emit PipelineCreated(pipelineId, msg.sender, agentIds.length, maxStage + 1, paymentToken);
    }

    /**
     * @notice Fund a pipeline with tokens
     * @param pipelineId Pipeline to fund
     * @param amount Amount of tokens to deposit
     */
    function fundPipeline(
        bytes32 pipelineId,
        uint256 amount
    ) external nonReentrant {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.createdAt != 0, "Pipeline not found");
        require(pipeline.status == PipelineStatus.Created, "Already funded");
        require(amount > 0, "Amount must be positive");
        
        // Transfer tokens
        IERC20(pipeline.paymentToken).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        
        pipeline.totalAmount = amount;
        pipeline.status = PipelineStatus.Funded;
        pipeline.fundedAt = block.timestamp;
        
        emit PipelineFunded(pipelineId, amount, pipeline.paymentToken);
    }

    // ============ Pipeline Execution ============
    
    /**
     * @notice Start a step in the current stage
     * @param pipelineId Pipeline being executed
     * @param stepIndex Index of step to start
     */
    function startStep(bytes32 pipelineId, uint256 stepIndex) 
        external 
        onlyRole(ORCHESTRATOR_ROLE) 
    {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.status == PipelineStatus.Funded || 
                pipeline.status == PipelineStatus.InProgress, "Not executable");
        
        // Check timeout
        if (pipeline.timeout > 0 && pipeline.fundedAt > 0) {
            require(block.timestamp <= pipeline.fundedAt + pipeline.timeout, "Pipeline timed out");
        }
        
        PipelineStep[] storage steps = pipelineSteps[pipelineId];
        require(stepIndex < steps.length, "Invalid step");
        
        PipelineStep storage step = steps[stepIndex];
        require(step.stageIndex == pipeline.currentStage, "Wrong stage");
        require(step.status == StepStatus.Pending, "Step not pending");
        
        // Check condition if set
        if (step.conditionHash != bytes32(0)) {
            // Condition must have been satisfied by a previous step result
            bool conditionMet = false;
            for (uint256 i = 0; i < stepIndex; i++) {
                bytes32 stepId = keccak256(abi.encodePacked(pipelineId, i));
                if (stepResults[stepId] == step.conditionHash) {
                    conditionMet = true;
                    break;
                }
            }
            if (!conditionMet) {
                step.status = StepStatus.Skipped;
                pipelineStages[pipelineId][step.stageIndex].completedCount++;
                emit StepSkipped(pipelineId, stepIndex, "Condition not met");
                _checkStageComplete(pipelineId);
                return;
            }
        }
        
        // Mark in progress
        if (pipeline.status == PipelineStatus.Funded) {
            pipeline.status = PipelineStatus.InProgress;
        }
        
        step.status = StepStatus.Running;
        emit StepStarted(pipelineId, stepIndex, step.agentId, step.stageIndex);
    }
    
    /**
     * @notice Complete a running step with optional result hash
     * @param pipelineId Pipeline being executed
     * @param stepIndex Index of step to complete
     * @param resultHash Optional result hash for conditional branching
     */
    function completeStep(bytes32 pipelineId, uint256 stepIndex, bytes32 resultHash) 
        external 
        onlyRole(ORCHESTRATOR_ROLE) 
        nonReentrant 
    {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.status == PipelineStatus.InProgress, "Not in progress");
        
        PipelineStep[] storage steps = pipelineSteps[pipelineId];
        require(stepIndex < steps.length, "Invalid step");
        
        PipelineStep storage step = steps[stepIndex];
        require(step.status == StepStatus.Running, "Step not running");
        
        // Calculate payment (after platform fee)
        uint256 netAmount = pipeline.totalAmount * (10000 - pipeline.platformFeeBps) / 10000;
        uint256 stepPayment = netAmount * step.paymentBps / 10000;
        
        // Pay developer
        IERC20(pipeline.paymentToken).safeTransfer(step.developer, stepPayment);
        
        step.status = StepStatus.Completed;
        
        // Store result for conditional branching
        if (resultHash != bytes32(0)) {
            bytes32 stepId = keccak256(abi.encodePacked(pipelineId, stepIndex));
            stepResults[stepId] = resultHash;
        }
        
        pipelineStages[pipelineId][step.stageIndex].completedCount++;
        
        emit StepCompleted(pipelineId, stepIndex, step.agentId, step.developer, stepPayment, resultHash);
        
        _checkStageComplete(pipelineId);
    }
    
    /**
     * @notice Retry a failed step
     * @param pipelineId Pipeline being executed
     * @param stepIndex Index of step to retry
     */
    function retryStep(bytes32 pipelineId, uint256 stepIndex) 
        external 
        onlyRole(ORCHESTRATOR_ROLE) 
    {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.status == PipelineStatus.InProgress, "Not in progress");
        
        PipelineStep[] storage steps = pipelineSteps[pipelineId];
        require(stepIndex < steps.length, "Invalid step");
        
        PipelineStep storage step = steps[stepIndex];
        require(step.status == StepStatus.Failed, "Step not failed");
        require(step.retryCount < step.maxRetries, "Max retries exceeded");
        
        step.retryCount++;
        step.status = StepStatus.Pending;
        
        emit StepRetried(pipelineId, stepIndex, step.retryCount);
    }
    
    /**
     * @notice Mark a step as failed
     * @param pipelineId Pipeline being executed
     * @param stepIndex Index of step that failed
     */
    function failStep(bytes32 pipelineId, uint256 stepIndex) 
        external 
        onlyRole(ORCHESTRATOR_ROLE) 
    {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.status == PipelineStatus.InProgress, "Not in progress");
        
        PipelineStep[] storage steps = pipelineSteps[pipelineId];
        require(stepIndex < steps.length, "Invalid step");
        
        PipelineStep storage step = steps[stepIndex];
        require(step.status == StepStatus.Running, "Step not running");
        
        step.status = StepStatus.Failed;
        
        emit StepFailed(pipelineId, stepIndex, step.agentId, step.retryCount);
        
        // If no retries left, check if we should fail the pipeline
        if (step.retryCount >= step.maxRetries) {
            _failPipelineInternal(pipelineId, step.stageIndex, stepIndex);
        }
    }
    
    /**
     * @notice Check if current stage is complete and advance if so
     */
    function _checkStageComplete(bytes32 pipelineId) internal {
        Pipeline storage pipeline = pipelines[pipelineId];
        PipelineStage storage stage = pipelineStages[pipelineId][pipeline.currentStage];
        
        if (stage.completedCount >= stage.stepCount) {
            stage.allCompleted = true;
            emit StageCompleted(pipelineId, pipeline.currentStage);
            
            // Check if all stages complete
            if (pipeline.currentStage + 1 >= pipeline.totalStages) {
                _completePipeline(pipelineId);
            } else {
                pipeline.currentStage++;
            }
        }
    }
    
    /**
     * @notice Complete the pipeline and pay platform fee
     */
    function _completePipeline(bytes32 pipelineId) internal {
        Pipeline storage pipeline = pipelines[pipelineId];
        pipeline.status = PipelineStatus.Completed;
        
        // Calculate total payouts
        uint256 netAmount = pipeline.totalAmount * (10000 - pipeline.platformFeeBps) / 10000;
        
        // Pay platform fee
        uint256 platformFee = pipeline.totalAmount * pipeline.platformFeeBps / 10000;
        if (platformFee > 0) {
            IERC20(pipeline.paymentToken).safeTransfer(platformFeeRecipient, platformFee);
        }
        
        emit PipelineCompleted(pipelineId, netAmount);
    }
    
    /**
     * @notice Internal function to fail pipeline and refund
     */
    function _failPipelineInternal(bytes32 pipelineId, uint256 stageIndex, uint256 stepIndex) internal {
        Pipeline storage pipeline = pipelines[pipelineId];
        pipeline.status = PipelineStatus.Failed;
        
        // Calculate paid amount and refund rest
        uint256 paidBps;
        PipelineStep[] storage steps = pipelineSteps[pipelineId];
        for (uint256 i = 0; i < steps.length; i++) {
            if (steps[i].status == StepStatus.Completed) {
                paidBps += steps[i].paymentBps;
            }
        }
        
        uint256 refundBps = 10000 - paidBps;
        uint256 netAmount = pipeline.totalAmount * (10000 - pipeline.platformFeeBps) / 10000;
        uint256 refundAmount = netAmount * refundBps / 10000;
        
        if (refundAmount > 0) {
            IERC20(pipeline.paymentToken).safeTransfer(pipeline.creator, refundAmount);
        }
        
        emit PipelineFailed(pipelineId, stageIndex, stepIndex);
    }

    /**
     * @notice Cancel a funded but not started pipeline
     * @param pipelineId Pipeline to cancel
     */
    function cancelPipeline(bytes32 pipelineId) external nonReentrant {
        Pipeline storage pipeline = pipelines[pipelineId];
        require(pipeline.creator == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(pipeline.status == PipelineStatus.Funded, "Cannot cancel");
        
        pipeline.status = PipelineStatus.Cancelled;
        
        // Refund full amount
        IERC20(pipeline.paymentToken).safeTransfer(pipeline.creator, pipeline.totalAmount);
        
        emit PipelineCancelled(pipelineId, pipeline.totalAmount);
    }

    // ============ View Functions ============
    
    function getPipelineSteps(bytes32 pipelineId) 
        external 
        view 
        returns (PipelineStep[] memory) 
    {
        return pipelineSteps[pipelineId];
    }
    
    function getPipelineStatus(bytes32 pipelineId) 
        external 
        view 
        returns (PipelineStatus) 
    {
        return pipelines[pipelineId].status;
    }

    // ============ Admin Functions ============
    
    function setSupportedToken(address token, bool supported) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        supportedTokens[token] = supported;
    }
    
    function setPlatformFee(uint256 feeBps) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(feeBps <= 1000, "Fee too high");
        defaultPlatformFeeBps = feeBps;
    }
}
