// Test OpenRouter model availability
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const apiKey = env['OPENROUTER_API_KEY'];
const models = ['qwen/qwen-2.5-72b-instruct', 'qwen/qwen-2-72b-instruct'];

for (const model of models) {
  process.stdout.write(`Testing ${model}... `);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "ok" in one word' }],
        max_tokens: 5,
      }),
    });
    const data = await res.json();
    if (res.ok && data.choices?.[0]?.message?.content) {
      console.log(`✅ OK (${data.choices[0].message.content.trim()})`);
    } else {
      console.log(`❌ Error: ${data.error?.message || JSON.stringify(data).slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`❌ Exception: ${e.message}`);
  }
}
