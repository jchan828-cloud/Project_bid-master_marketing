import { PARAMETERS, setParameter, ParameterKey } from '../src/lib/aws-parameters';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  const isInteractive = process.argv.includes('--interactive');
  const env = process.env.NODE_ENV || 'development';

  console.log(`Setting up parameters for environment: ${env}`);

  if (!isInteractive) {
    console.log('Non-interactive mode not yet fully implemented. Use --interactive');
    process.exit(0);
  }

  for (const [key, config] of Object.entries(PARAMETERS)) {
    const paramKey = key as ParameterKey;
    const currentValue = (config as any).default || '';
    
    console.log(`\nParameter: ${config.name}`);
    console.log(`Description: Bid-Master Marketing: ${paramKey}`);
    if ((config as any).default) console.log(`Default: ${(config as any).default}`);

    const answer = await question(`Enter value for ${config.name} (leave empty to skip/use default): `);

    if (answer.trim()) {
      await setParameter(paramKey, answer.trim());
    } else {
      console.log('Skipping...');
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
