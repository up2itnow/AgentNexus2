# 🎯 Easy Deployment Guide for Beginners

**Don't worry! This guide will walk you through everything step-by-step.**

---

## 📋 What You Need (Prerequisites)

Before we start, you'll need:

1. ✅ **Alchemy Account** - You already have this!
2. ⏳ **MetaMask Wallet** - We'll set this up
3. ⏳ **Basescan Account** - Free, takes 2 minutes
4. ⏳ **Testnet ETH** - Free from faucet

**Estimated Time**: 30-45 minutes  
**Cost**: $0 (everything is free on testnet!)

---

## 🦊 Step 1: Set Up MetaMask Wallet (5 minutes)

### If You Don't Have MetaMask:

1. **Install MetaMask**
   - Go to: https://metamask.io/download/
   - Click "Install MetaMask for Chrome" (or your browser)
   - Follow the installation wizard

2. **Create a New Wallet**
   - Open MetaMask extension
   - Click "Create a new wallet"
   - Create a strong password
   - **CRITICAL**: Write down your 12-word recovery phrase on paper
   - Store it somewhere VERY safe (this is your backup!)
   - Complete the setup

3. **Add Base Sepolia Network**
   - Open MetaMask
   - Click the network dropdown (top left, says "Ethereum Mainnet")
   - Click "Add Network"
   - Click "Add a network manually"
   - Fill in these details:

   ```
   Network Name: Base Sepolia
   RPC URL: https://sepolia.base.org
   Chain ID: 84532
   Currency Symbol: ETH
   Block Explorer: https://sepolia.basescan.org
   ```

   - Click "Save"
   - Switch to "Base Sepolia" network

4. **Get Your Wallet Address**
   - Open MetaMask
   - Click on your account name at the top
   - Your address looks like: `0x1234...5678`
   - Click to copy it
   - **Save this address** - you'll need it!

5. **Export Your Private Key** (FOR TESTNET ONLY!)
   - Open MetaMask
   - Click the three dots (⋮) menu
   - Click "Account Details"
   - Click "Show Private Key"
   - Enter your MetaMask password
   - Click to reveal and copy your private key
   - **IMPORTANT**: This private key is ONLY for testnet. NEVER share your mainnet private key!
   - **Save this private key** - you'll need it for the .env file

---

## 💧 Step 2: Get Free Testnet ETH (5 minutes)

You need testnet ETH to deploy contracts. It's completely free!

### Option 1: Base Sepolia Faucet (Recommended)
1. Visit: https://www.base.org/faucet
2. Connect your MetaMask wallet
3. Request ETH
4. Wait 1-2 minutes
5. Check MetaMask - you should see 0.1-0.5 ETH

### Option 2: Alternative Faucets
If the Base faucet isn't working, try these:

- **Coinbase Faucet**: https://coinbase.com/faucets/base-ethereum-goerli-faucet
- **Alchemy Faucet**: https://www.alchemy.com/faucets/base-sepolia

### Verify You Have ETH
- Open MetaMask
- Make sure you're on "Base Sepolia" network
- You should see a balance like "0.25 ETH"
- If you see 0, wait a few minutes and refresh

---

## 🔑 Step 3: Get Basescan API Key (5 minutes)

This allows automatic contract verification (makes your contracts visible on Basescan).

1. **Create Basescan Account**
   - Go to: https://basescan.org/register
   - Enter your email address
   - Create a password
   - Complete the registration
   - Verify your email (check inbox/spam)

2. **Generate API Key**
   - Log in to Basescan
   - Go to: https://basescan.org/myapikey
   - Click "Add" to create a new API key
   - Give it a name like "AgentNexus Deployment"
   - Click "Create New API Key"
   - **Copy your API key** - it looks like: `ABC123XYZ...`
   - **Save this API key** - you'll need it!

**Note**: If you can't get a Basescan API key, that's okay! The deployment will still work, but you'll need to verify contracts manually later.

---

## 🛠️ Step 4: Get Your Alchemy RPC URL (2 minutes)

You mentioned you already have an Alchemy project for AgentNexus. Let's get the RPC URL:

1. **Log in to Alchemy**
   - Go to: https://dashboard.alchemy.com/
   - Log in with your account

2. **Select Your AgentNexus Project**
   - Click on "Apps" in the left sidebar
   - Find your "AgentNexus" project
   - Click on it

3. **Get Base Sepolia RPC URL**
   - Make sure "Base Sepolia" is selected in the network dropdown
   - Click "API Key" button (top right)
   - You'll see a section called "HTTPS"
   - Copy the URL - it looks like:
     ```
     https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY-HERE
     ```
   - **Save this URL** - you'll need it!

**Alternative**: If you don't have Base Sepolia in your project, you can use the public RPC:
```
https://sepolia.base.org
```

---

## 📝 Step 5: Create the .env File (5 minutes)

Now we'll create the configuration file with all the information you collected.

### Easy Method: Use This Command

1. **Open Terminal** (Mac) or **Command Prompt** (Windows)

2. **Navigate to the smart contracts folder**:
   ```bash
   cd /Users/billwilson_home/Desktop/AgentNexus-V1/smart-contracts
   ```

3. **Create the .env file** (copy this entire block and paste it in terminal):
   ```bash
   cat > .env << 'EOF'
   # Replace these values with YOUR information:

   # Your MetaMask private key (the one you copied earlier)
   # REMOVE the "0x" prefix if it has one
   PRIVATE_KEY=your_private_key_here_without_0x_prefix

   # Your Alchemy RPC URL for Base Sepolia
   BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY

   # Your Basescan API key
   BASESCAN_API_KEY=your_basescan_api_key_here

   # Platform fee recipient (leave as is for now)
   PLATFORM_FEE_RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   EOF
   ```

4. **Edit the .env file** with your actual values:
   ```bash
   nano .env
   ```
   
   Or open it in a text editor:
   ```bash
   open .env
   ```

5. **Replace these placeholders**:
   - `your_private_key_here_without_0x_prefix` → Your MetaMask private key (NO "0x" at the start!)
   - `https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY` → Your Alchemy RPC URL
   - `your_basescan_api_key_here` → Your Basescan API key

6. **Save the file**
   - If using nano: Press `Ctrl+X`, then `Y`, then `Enter`
   - If using text editor: Just save and close

### Example of a Completed .env File:
```env
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/abc123xyz789
BASESCAN_API_KEY=XYZ789ABC123
PLATFORM_FEE_RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

---

## 🚀 Step 6: Deploy the Smart Contracts (10 minutes)

Now for the exciting part - deploying your contracts!

1. **Make sure you're in the smart-contracts directory**:
   ```bash
   cd /Users/billwilson_home/Desktop/AgentNexus-V1/smart-contracts
   ```

2. **Run the deployment script**:
   ```bash
   ./scripts/deploy-sepolia.sh
   ```

3. **What You'll See**:
   - The script will check your balance (should show ~0.25 ETH)
   - It will ask: "Continue with deployment? (y/N)"
   - Type `y` and press Enter
   - You'll see deployment logs (lots of text!)
   - After 2-5 minutes, you'll see: "✓ Deployment successful!"

4. **Save the Contract Addresses**:
   - The script will show something like:
     ```
     AgentNexusEscrow:       0xABCD1234...
     AgentNexusEntitlements: 0xEFGH5678...
     ```
   - **SAVE THESE ADDRESSES** - you'll need them later!
   - They're also saved in `DEPLOYED_CONTRACTS.md`

### If Something Goes Wrong:
- **"Insufficient balance"**: Get more testnet ETH from the faucet
- **"Invalid private key"**: Check your .env file, make sure no "0x" prefix
- **"RPC error"**: Check your Alchemy RPC URL is correct
- **Script won't run**: Make sure it's executable: `chmod +x scripts/deploy-sepolia.sh`

---

## 📦 Step 7: Export ABIs (2 minutes)

ABIs are the "interfaces" that let your backend/frontend talk to the contracts.

1. **Run the export script**:
   ```bash
   ./scripts/export-abis.sh
   ```

2. **What This Does**:
   - Copies contract ABIs to `backend/src/contracts/`
   - Copies contract ABIs to `frontend/src/contracts/`
   - You'll see: "✓ ABI export complete!"

---

## 🔐 Step 8: Grant Backend Roles (10 minutes)

Your backend needs permission to interact with the contracts. We'll set this up later when the backend is running.

**For now, you can skip this step!** We'll come back to it when we:
1. Have the backend server running
2. Know the backend wallet address

---

## ✅ Step 9: Verify Everything Worked

Let's make sure everything deployed correctly!

### Check on Basescan:

1. **View Your Escrow Contract**:
   - Go to: https://sepolia.basescan.org/address/YOUR_ESCROW_ADDRESS
   - Replace `YOUR_ESCROW_ADDRESS` with the address from step 6
   - You should see:
     - ✓ "Contract" tab with verified source code
     - ✓ Green checkmark ✓ next to the contract name
     - ✓ "Read Contract" and "Write Contract" tabs

2. **View Your Entitlements Contract**:
   - Go to: https://sepolia.basescan.org/address/YOUR_ENTITLEMENTS_ADDRESS
   - Same checks as above

### If Contracts Aren't Verified:
Don't worry! Sometimes auto-verification fails. You can verify manually later or it will work fine without verification for testing.

---

## 🎉 Success! What You've Accomplished

Congratulations! You've just:

✅ Set up a MetaMask wallet  
✅ Added Base Sepolia network  
✅ Got free testnet ETH  
✅ Created a Basescan account  
✅ Got your Alchemy RPC URL  
✅ Created the .env configuration file  
✅ **Deployed two smart contracts to Base Sepolia!**  
✅ Exported ABIs for backend/frontend integration  

Your contracts are now live on Base Sepolia testnet! 🚀

---

## 📋 What You Have Now

1. **Two Deployed Contracts**:
   - `AgentNexusEscrow` - Handles payments
   - `AgentNexusEntitlements` - Handles access tokens

2. **Contract Addresses**: Saved in `DEPLOYED_CONTRACTS.md`

3. **ABIs Exported**: Ready for backend/frontend to use

4. **Verified on Basescan**: Public and transparent

---

## 🚨 IMPORTANT SECURITY NOTES

### ⚠️ NEVER Share These:
- ❌ Your private key
- ❌ Your recovery phrase (12 words)
- ❌ Your .env file

### ✅ Safe to Share:
- ✓ Your wallet address (0x123...)
- ✓ Contract addresses
- ✓ Basescan links
- ✓ RPC URLs (public endpoints)

### 🔒 Testnet vs Mainnet:
- **Testnet**: Practice with fake ETH (what we just did)
- **Mainnet**: Real money, be VERY careful
- **Our private key is ONLY for testnet** - don't use it on mainnet!

---

## 📈 Next Steps

Now that your contracts are deployed, you can:

1. **Update Backend Configuration**:
   - Add contract addresses to `backend/.env`
   - Configure backend to use the contracts

2. **Update Frontend Configuration**:
   - Add contract addresses to `frontend/.env`
   - Enable wallet connection

3. **Test the Full Flow**:
   - Make a test deposit
   - Mint a test entitlement
   - Verify everything works

4. **Move to Production**:
   - Later, deploy to Base Mainnet
   - Use a fresh wallet with real ETH

---

## 🆘 Getting Help

### Common Issues:

**"Command not found"**
- Make sure you're in the `smart-contracts` directory
- Run: `cd /Users/billwilson_home/Desktop/AgentNexus-V1/smart-contracts`

**"Permission denied"**
- Make scripts executable:
  ```bash
  chmod +x scripts/deploy-sepolia.sh
  chmod +x scripts/export-abis.sh
  ```

**"Insufficient balance"**
- Get more testnet ETH from faucet
- Wait 5 minutes and try again

**"Invalid private key"**
- Check .env file
- Remove "0x" prefix from private key
- Make sure no extra spaces

**"RPC error" or "Connection failed"**
- Check your Alchemy RPC URL
- Try the public RPC: `https://sepolia.base.org`

### Still Stuck?

Check these files for more details:
- `PHASE_6B_DEPLOYMENT_CHECKLIST.md` - Detailed technical guide
- `PHASE_6B_DEPLOYMENT_READY.md` - Quick reference
- `deployment.log` - Full deployment log (created after deployment)

---

## 🎯 Summary Checklist

Before you start:
- [ ] MetaMask installed and set up
- [ ] Base Sepolia network added to MetaMask
- [ ] Testnet ETH in your wallet (0.1+ ETH)
- [ ] Basescan account created
- [ ] Basescan API key obtained
- [ ] Alchemy RPC URL copied
- [ ] .env file created with all your info

Deployment:
- [ ] Ran `./scripts/deploy-sepolia.sh`
- [ ] Saw "Deployment successful!"
- [ ] Saved contract addresses
- [ ] Ran `./scripts/export-abis.sh`
- [ ] Verified contracts on Basescan

---

**You've got this! Follow these steps carefully and you'll have your contracts deployed in no time.** 🚀

If you get stuck on any step, just let me know which step number and what error message you're seeing!


