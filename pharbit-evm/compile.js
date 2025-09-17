const solc = require('solc');
const fs = require('fs');
const path = require('path');

function findImports(importPath) {
    try {
        if (importPath.startsWith('@openzeppelin/')) {
            const npmPath = path.join(__dirname, 'node_modules', importPath);
            return {
                contents: fs.readFileSync(npmPath, 'utf8')
            };
        }
        const fullPath = path.resolve(__dirname, 'contracts', importPath);
        return {
            contents: fs.readFileSync(fullPath, 'utf8')
        };
    } catch (e) {
        console.error('Import not found:', importPath);
        return { error: 'File not found' };
    }
}

function compile(contractPath) {
    const content = fs.readFileSync(contractPath, 'utf8');
    
    const input = {
        language: 'Solidity',
        sources: {
            'PharbitDeployer.sol': {
                content
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            },
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    };

    const output = JSON.parse(
        solc.compile(JSON.stringify(input), { import: findImports })
    );

    // Create artifacts directory if it doesn't exist
    const artifactsDir = path.join(__dirname, 'artifacts', 'contracts');
    fs.mkdirSync(artifactsDir, { recursive: true });

    // Save each contract's artifacts
    for (const contractFile in output.contracts) {
        for (const contract in output.contracts[contractFile]) {
            const artifactPath = path.join(
                artifactsDir,
                `${contractFile}`,
                `${contract}.json`
            );
            fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
            fs.writeFileSync(
                artifactPath,
                JSON.stringify(output.contracts[contractFile][contract], null, 2)
            );
        }
    }

    console.log('Compilation completed successfully!');
}

// Compile the main contract
compile(path.join(__dirname, 'contracts', 'PharbitDeployer.sol'));