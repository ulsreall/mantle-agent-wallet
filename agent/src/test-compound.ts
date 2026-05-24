import { SwapExecutor } from './swap';
import { executeCompoundStrategy } from './compound';

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }
  
  const executor = new SwapExecutor(pk);
  console.log('Starting compound strategy with 0.05 MNT...');
  const result = await executeCompoundStrategy(executor, 0.05, 1);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
