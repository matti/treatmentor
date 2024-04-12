import 'dotenv/config';

import fs from 'fs/promises';
import yargs from 'yargs'
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { scriptToTreatment, jsonToString } from './tools.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const argv = yargs(process.argv.slice(2))
.options({
        'output':{
            alias: 'o',
            describe: 'output filename.',
            type: 'string',
            default: "output.txt",
        }
})
.showHelpOnFail(true, 'Error: Missing positional argument. Please provide a positional argument')
.demandCommand(1)
.usage('Usage: $0 [options] <script>')
.alias('h', 'help')
.parse();

const args = argv._;


async function main() {
    const scriptJson = JSON.parse(await fs.readFile(args[0]));
    const treatments = (await loadFilesFromDirectory(path.join(__dirname, 'treatments')))
                        .map(((text, index) => ( { role:'user', content: `EXAMPLE ${index + 1}: ${text}` }  ))
                    )
    const scriptPrompt = jsonToString(scriptJson);
    const stream = await scriptToTreatment(scriptPrompt, treatments)

    let response = "";

    for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || ""
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }

    await fs.writeFile(argv.output, response.replace(/\*/g, ''))
}

async function loadFilesFromDirectory(directory) {
    try {
      const filesInDirectory = await fs.readdir(directory);
      const filesData = await Promise.all(
        filesInDirectory.map(async (file) => {
          const filePath = path.join(directory, file);
          const fileData = await fs.readFile(filePath, 'utf-8');
          return fileData;
        })
      );
      return filesData;
    } catch (error) {
      console.error('Error loading files:', error);
      throw error;
    }
  }


main()