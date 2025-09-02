import path from 'path';
import fs from 'fs';

export async function startTracing( context, testName) {
  
  const tracePath = path.join(__dirname, `../traces/${testName}-trace.zip`);
  // if(!fs.existsSync(path.dirname(tracePath))){
  //   fs.mkdirSync(path.dirname(tracePath), { recursive: true });
  // }
  await context.tracing.start({screenshots: true, snapshots: true, sources: true});
}

export  async function stopTracing(context, testName) {
    const tracePath = path.join(__dirname, `../traces/${testName}-trace.zip`);
    await context.tracing.stop({path: tracePath});
    return tracePath;
}