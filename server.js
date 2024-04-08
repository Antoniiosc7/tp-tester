const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const git = simpleGit();
const app = express();
const rimraf = require('rimraf'); // Add this at the top of your file
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker();
const yaml = require('js-yaml');
const { BASE_URL } = require('./config');
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'GlassMatrix API',
      description: 'API Glassmatrix',
      contact: {
        name: 'github.com/antoniiosc7'
      },
      servers: [`http://tfg.antoniosaborido.es:6012`]
    }
  },
  // ['.routes/*.js']
  apis: ['server.js']
};

app.use(cors());
app.use(bodyParser.json());

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
const apiName = '/glassmatrix/api/v1';

app.use((req, res, next) => {
  console.log(`Inicio de petición: ${req.method} ${req.path}`);
  next();
});

app.use((err, req, res, next) => {
  console.error(`Error en petición: ${req.method} ${req.path}`);
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});
/**
 * @swagger
 * /glassmatrix/api/v1/documentation:
 *  get:
 *    tags: [documentation]
 *    description: Use to get the documentation PDF
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/documentation', (req, res) => {
  const filePath = path.join(__dirname, 'assets', 'documentation.pdf');
  res.sendFile(filePath);
});

/**
 * @swagger
 * /glassmatrix/api/v1/pdf:
 *  get:
 *    tags: [documentation]
 *    description: Use to get the documentation PDF
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/pdf', (req, res) => {
  const filePath = path.join(__dirname, 'assets', 'documentation.pdf');
  res.sendFile(filePath);
});
/**
 * @swagger
 * tags:
 *   - name: Bluejay
 *     description: Endpoints for the Bluejay section
 *   - name: Github
 *     description: Endpoints for the Github section
 */
app.get('/api/containers', (req, res) => {
  docker.listContainers({all: false}, (err, containers) => {
    if (err) {
      res.status(500).send(err);
    } else {
      const containerData = containers.map(containerInfo => docker.getContainer(containerInfo.Id).inspect());
      Promise.all(containerData)
        .then(data => res.send(data))
        .catch(err => res.status(500).send(err));
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/save:
 *  post:
 *    tags: [Bluejay]
 *    description: Use to save a file
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be saved
 *        in: formData
 *        required: true
 *        type: string
 *      - name: content
 *        description: Content of the file to be saved
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/tpa/save', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/individualMetrics', `${data.fileName}.json`);
  fs.writeFile(filePath, JSON.stringify(data.content, null, 2), (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while saving the file.' });
    } else {
      res.json({ message: 'File saved successfully.' });
    }
  });
});

/**
 * @swagger
 * /glassmatrix/api/v1/tests/saveYAMLFile:
 *  post:
 *    tags: [tester]
 *    description: Use to save a YAML file
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/tests/saveYAMLFile', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '/src/assets/savedYAML', `${data.fileName}.yaml`);
  fs.writeFile(filePath, data.content, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while saving the file.' });
    } else {
      res.json({ message: 'File saved successfully.' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tests/getAllYAMLFiles:
 *  get:
 *    tags: [tester]
 *    description: Use to get all YAML files
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/tests/getAllYAMLFiles', (req, res) => {
  const dirPath = path.join(__dirname, '/src/assets/savedYAML');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the directory.' });
    } else {
      const yamlFiles = files.filter(file => path.extname(file) === '.yaml');
      res.json(yamlFiles);
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tests/loadYAMLFile/{fileName}:
 *  get:
 *    description: Use to load a specific YAML file
 *    tags: [tester]
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be loaded
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/tests/loadYAMLFile/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '/src/assets/savedYAML', `${fileName}`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the file.' });
    } else {
      try {
        const yamlData = yaml.load(data);
        res.json(yamlData);
      } catch (e) {
        res.status(500).json({ message: 'An error occurred while parsing the YAML file.' });
      }
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tests/updateYAMLFile/{fileName}:
 *  put:
 *    tags: [tester]
 *    description: Use to update a specific YAML file
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be updated
 *        in: path
 *        required: true
 *        type: string
 *      - name: content
 *        description: New content of the file
 *        in: body
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      '200':
 *        description: A successful response
 *      '500':
 *        description: An error occurred while updating the file
 */
app.put(apiName + '/tests/updateYAMLFile/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const newContent = req.body.content;
  const filePath = path.join(__dirname, '/src/assets/savedYAML', `${fileName}`);
  fs.writeFile(filePath, newContent, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while updating the file.' });
    } else {
      res.json({ message: 'File updated successfully.' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tests/deleteYAMLFile/{fileName}:
 *  delete:
 *    tags: [tester]
 *    description: Use to delete a YAML file
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be deleted
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/tests/deleteYAMLFile/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '/src/assets/savedYAML', `${fileName}`);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while deleting the file.' });
    } else {
      res.json({ message: 'File deleted successfully.' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/saveTPAMetric:
 *  post:
 *    tags: [Bluejay]
 *    description: Use to save a TPA metric
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/tpa/saveTPAMetric', (req, res) => {
  const data = req.body;
  const dirPath = path.join(__dirname, `/src/assets/savedMetrics/tpaMetrics/${data.folderName}`);
  const filePath = path.join(dirPath, `${data.fileName}.json`);

  if (!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFile(filePath, data.content, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while saving the file.' });
    } else {
      res.json({ message: 'File saved successfully.' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/update:
 *  post:
 *    description: Use to update a file
 *    tags: [Bluejay]
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be updated
 *        in: formData
 *        required: true
 *        type: string
 *      - name: content
 *        description: Updated content of the file
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/tpa/update', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/individualMetrics', `${data.fileName}`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlinkSync(filePath);
    }
    fs.writeFile(filePath, JSON.stringify(data.content, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while saving the file.' });
      } else {
        res.json({ message: 'File updated successfully.' });
      }
    });
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/updateTPAMetric:
 *  post:
 *    tags: [Bluejay]
 *    description: Use to update a TPA metric
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/tpa/updateTPAMetric', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/tpaMetrics', data.folderName, `${data.fileName}`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlinkSync(filePath);
    }
    fs.writeFile(filePath, JSON.stringify(data.content, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while saving the file.' });
      } else {
        res.json({ message: 'File updated successfully.' });
      }
    });
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/files:
 *  get:
 *    tags: [Bluejay]
 *    description: Use to get all the .json files in the assets directory
 *    responses:
 *      '200':
 *        description: A successful response
 */
// Método GET para obtener todos los archivos .json en la carpeta de assets
app.get(apiName + '/tpa/indifivualFiles', (req, res) => {
  const dirPath = path.join(__dirname, '/src/assets/savedMetrics/individualMetrics');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the directory.' });
    } else {
      const jsonFiles = files.filter(file => path.extname(file) === '.json');
      res.json(jsonFiles);
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/loadFolders:
 *  get:
 *    tags: [Bluejay]
 *    description: Use to load all folders
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/tpa/loadFolders', (req, res) => {
  const dirPath = path.join(__dirname, '/src/assets/savedMetrics/tpaMetrics');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the directory.' });
    } else {
      const directories = files.filter(file => {
        const filePath = path.join(dirPath, file);
        return fs.statSync(filePath).isDirectory();
      });
      res.json(directories);
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/loadFolders/{subdirectory}:
 *  get:
 *    tags: [Bluejay]
 *    description: Use to load a specific subdirectory
 *    parameters:
 *      - name: subdirectory
 *        description: Name of the subdirectory to be loaded
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/tpa/loadFolders/:subdirectory', (req, res) => {
  const subdirectory = req.params.subdirectory;
  const dirPath = path.join(__dirname, '/src/assets/savedMetrics/tpaMetrics', subdirectory);
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the directory.' });
    } else {
      res.json(files);
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/loadFolders/{subdirectory}/{file}:
 *  get:
 *    tags: [Bluejay]
 *    description: Use to load a specific file in a specific subdirectory
 *    parameters:
 *      - name: subdirectory
 *        description: Name of the subdirectory
 *        in: path
 *        required: true
 *        type: string
 *      - name: file
 *        description: Name of the file to be loaded
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */

app.get(apiName + '/tpa/loadFolders/:subdirectory/:file', (req, res) => {
  const subdirectory = req.params.subdirectory;
  const file = req.params.file;
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/tpaMetrics', subdirectory, file);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the file.' });
    } else {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (e) {
        res.status(500).json({ message: 'An error occurred while parsing the JSON file.' });
      }
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/files/{fileName}:
 *  get:
 *    tags: [Bluejay]
 *    description: Use to get the content of a specific .json file
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be fetched
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/tpa/files/:fileName', (req, res) => {
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/individualMetrics', `${req.params.fileName}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the file.' });
    } else {
      res.json(JSON.parse(data));
    }
  });
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/files/{fileName}:
 *  delete:
 *    tags: [Bluejay]
 *    description: Use to delete a specific file
 *    parameters:
 *      - name: fileName
 *        description: Name of the file to be deleted
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/tpa/files/:fileName', (req, res) => {
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/individualMetrics', `${req.params.fileName}`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', err);
      res.status(404).json({ message: 'File does not exist.' });
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('An error occurred while deleting the file:', err);
          res.status(500).json({ message: 'An error occurred while deleting the file.' });
        } else {
          res.json({ message: 'File deleted successfully.' });
        }
      });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/tpa/files/tpaFile/{subdirectory}/{fileName}:
 *  delete:
 *    tags: [Bluejay]
 *    description: Use to delete a specific file in a specific subdirectory
 *    parameters:
 *      - name: subdirectory
 *        description: Name of the subdirectory
 *        in: path
 *        required: true
 *        type: string
 *      - name: fileName
 *        description: Name of the file to be deleted
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/tpa/files/tpaFile/:subdirectory/:fileName', (req, res) => {
  const filePath = path.join(__dirname, '/src/assets/savedMetrics/tpaMetrics', req.params.subdirectory, `${req.params.fileName}`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', err);
      res.status(404).json({ message: 'File does not exist.' });
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('An error occurred while deleting the file:', err);
          res.status(500).json({ message: 'An error occurred while deleting the file.' });
        } else {
          res.json({ message: 'File deleted successfully.' });
        }
      });
    }
  });
});
/**
 * @swagger
 *  /glassmatrix/api/v1/github/token/save:
 *  post:
 *    tags: [Github]
 *    description: Use to save a token
 *    parameters:
 *      - name: token
 *        description: Token to be saved
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/token/save', (req, res) => {
  const token = req.body.token;
  const filePath = path.join(__dirname, '/src/assets/token', 'code.json');

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlinkSync(filePath);
    }
    fs.writeFile(filePath, JSON.stringify({ token }, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while saving the token.' });
      } else {
        res.json({ message: 'Token saved successfully.' });
      }
    });
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/token/get:
 *  get:
 *    tags: [Github]
 *    description: Use to get the saved token
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/github/token/get', (req, res) => {
  const filePath = path.join(__dirname, '/src/assets/token', 'code.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while reading the token.' });
    } else {
      const { token } = JSON.parse(data);
      res.json({ token });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/token/delete:
 *  delete:
 *    tags: [Github]
 *    description: Use to delete the saved token
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/github/token/delete', (req, res) => {
  const filePath = path.join(__dirname, '/src/assets/token', 'code.json');

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', err);
      res.status(404).json({ message: 'File does not exist.' });
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('An error occurred while deleting the file:', err);
          res.status(500).json({ message: 'An error occurred while deleting the file.' });
        } else {
          res.json({ message: 'File deleted successfully.' });
        }
      });
    }
  });
});

/**
 * @swagger
 * /glassmatrix/api/v1/github/cloneRepo:
 *  post:
 *    tags: [Github]
 *    description: Use to clone a GitHub repository
 *    parameters:
 *      - name: owner
 *        description: Owner of the repository
 *        in: formData
 *        required: true
 *        type: string
 *      - name: repoName
 *        description: Name of the repository to be cloned
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */

app.post(apiName + '/github/cloneRepo', (req, res) => {
  const { owner, repoName } = req.body;
  const repoUrl = `https://github.com/${owner}/${repoName}.git`;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  // Delete the directory before cloning
  rimraf(repoPath, (err) => {
    if (err) {
      res.status(500).send('Error deleting directory: ' + err.message);
    } else {
      console.log(`Cloning repository ${repoName} into ${repoPath}`);
      git.clone(repoUrl, repoPath)
        .then(() => {
          console.log('Repository cloned successfully');
          res.json({ message: 'Repository cloned successfully' });
        })
        .catch((error) => {
          console.error('Error cloning repository:', error);
          res.status(500).send('Error cloning repository: ' + error.message);
        });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/listRepos:
 *  get:
 *    tags: [Github]
 *    description: Use to list all the cloned repositories
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/github/listRepos', (req, res) => {
  const repoPath = path.join(__dirname, 'assets', 'repositories');

  try {
    const files = fs.readdirSync(repoPath, { withFileTypes: true });
    const directories = files
      .filter(file => file.isDirectory() && !file.name.startsWith('.'))
      .map(file => file.name);
    res.json({ repositories: directories });
  } catch (err) {
    res.status(500).send('Error reading directory: ' + err.message);
  }
});

/**
 * @swagger
 * /glassmatrix/api/v1/github/branches/{repoName}:
 *  get:
 *    tags: [Github]
 *    description: Use to get all the branches of a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/github/branches/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout, stderr } = await exec('git branch', { cwd: repoPath });
    if (stderr) {
      console.error('Error listing branches:', stderr);
      res.status(500).send('Error listing branches: ' + stderr);
    } else {
      const branches = stdout.split('\n').map(branch => branch.trim()).filter(Boolean);
      res.json({ branches });
    }
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/deleteRepo/{repoName}:
 *  delete:
 *    tags: [Github]
 *    description: Use to delete a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository to be deleted
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/github/deleteRepo/:repoName', (req, res) => {
  const { repoName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  rimraf(repoPath, (err) => {
    if (err) {
      console.error('Error deleting repository:', err);
      res.status(500).send('Error deleting repository: ' + err.message);
    } else {
      console.log(`Repository ${repoName} deleted successfully`);
      res.json({ message: 'Repository deleted successfully' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/createBranch/{repoName}:
 *  post:
 *    tags: [Github]
 *    description: Use to create a new branch in a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: branchName
 *        description: Name of the new branch
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/createBranch/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const { branchName } = req.body;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout: stdoutCheckout, stderr: stderrCheckout } = await exec(`git checkout -b ${branchName}`, { cwd: repoPath });
    if (stderrCheckout && !stderrCheckout.includes('Switched to a new branch')) {
      console.error('Error creating branch:', stderrCheckout);
      res.status(500).send('Error creating branch: ' + stderrCheckout);
    } else {
      const { stdout: stdoutPush, stderr: stderrPush } = await exec(`git push -u origin ${branchName}`, { cwd: repoPath });
      if (stderrPush) {
        console.log('Git push stderr:', stderrPush);
      }
      res.json({ message: `Branch ${branchName} created and pushed successfully`, stdout: stdoutCheckout + stdoutPush, stderr: stderrCheckout + stderrPush });
    }
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/pullCurrentBranch/{repoName}:
 *  get:
 *    tags: [Github]
 *    description: Use to pull the current branch of a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/github/pullCurrentBranch/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout, stderr } = await exec('git pull', { cwd: repoPath });
    if (stderr) {
      console.error('Error pulling current branch:', stderr);
      res.status(500).send('Error pulling current branch: ' + stderr);
    } else {
      res.json({ message: `Pulled current branch successfully` });
    }
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/deleteBranch/{repoName}/{branchName}:
 *  delete:
 *    tags: [Github]
 *    description: Use to delete a specific branch of a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: branchName
 *        description: Name of the branch to be deleted
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.delete(apiName + '/github/deleteBranch/:repoName/:branchName', async (req, res) => {
  const { repoName, branchName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    await exec(`git checkout main`, { cwd: repoPath });

    const { stdout, stderr } = await exec(`git branch -d ${branchName}`, { cwd: repoPath });
    if (stderr) {
      console.error('Error deleting branch:', stderr);
      res.status(500).send('Error deleting branch: ' + stderr);
    } else {
      res.json({ message: `Branch ${branchName} deleted successfully` });
    }
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/changeBranch/{repoName}/{branchName}:
 *  post:
 *    tags: [Github]
 *    description: Use to switch to a different branch in a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: branchName
 *        description: Name of the branch to switch to
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/changeBranch/:repoName/:branchName', async (req, res) => {
  const { repoName, branchName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout, stderr } = await exec(`git checkout ${branchName}`, { cwd: repoPath });
    if (stderr && !stderr.includes('Switched to branch')) {
      console.error('Error changing branch:', stderr);
      res.status(500).send('Error changing branch: ' + stderr);
    } else {
      res.json({ message: `Switched to branch ${branchName} successfully` });
    }
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/files/{repoName}:
 *  get:
 *    tags: [Github]
 *    description: Use to get all the files in a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(apiName + '/github/files/:repoName', (req, res) => {
  const { repoName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  fs.readdir(repoPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Error reading directory: ' + err.message);
    } else {
      res.json({ files });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/commit/{repoName}:
 *  post:
 *    description: Use to create a new commit in a specific repository
 *    tags: [Github]
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: fileContent
 *        description: Content of the file to be committed
 *        in: formData
 *        required: true
 *        type: string
 *      - name: commitMessage
 *        description: Message of the commit
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/commit/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const { fileContent, commitMessage } = req.body;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);
  const filePath = path.join(repoPath, 'nuevoFichero');

  fs.writeFile(filePath, fileContent, async (err) => {
    if (err) {
      console.error('Error writing file:', err);
      res.status(500).send('Error writing file: ' + err.message);
    } else {
      try {
        const { stdout, stderr } = await exec(`git add . && git commit -m "${commitMessage}"`, { cwd: repoPath });
        if (stderr) {
          console.log('Git commit stderr:', stderr);
        }
        res.json({ message: 'Commit created successfully', stdout, stderr });
      } catch (err) {
        console.error('Error executing git command:', err);
        res.status(500).send('Error executing git command: ' + err.message);
      }
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/commitAll/{repoName}:
 *  post:
 *    tags: [Github]
 *    description: Use to commit all changes in a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: commitMessage
 *        description: Message of the commit
 *        in: body
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      '200':
 *        description: A successful response
 *      '500':
 *        description: An error occurred while committing
 */
app.post(apiName + '/github/commitAll/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const { commitMessage } = req.body;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout, stderr } = await exec(`git add . && git commit -m "${commitMessage}"`, { cwd: repoPath });
    if (stderr) {
      console.log('Git commit stderr:', stderr);
    }
    res.json({ message: 'Commit created successfully', stdout, stderr });
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/createFile/{repoName}:
 *  post:
 *    tags: [Github]
 *    description: Use to create a new file in a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *      - name: fileName
 *        description: Name of the new file
 *        in: formData
 *        required: true
 *        type: string
 *      - name: fileContent
 *        description: Content of the new file
 *        in: formData
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/createFile/:repoName', (req, res) => {
  const { repoName } = req.params;
  const { fileName, fileContent } = req.body;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);
  const filePath = path.join(repoPath, fileName);

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      console.error('Error creating file:', err);
      res.status(500).send('Error creating file: ' + err.message);
    } else {
      res.json({ message: 'File created successfully' });
    }
  });
});
/**
 * @swagger
 * /glassmatrix/api/v1/github/push/{repoName}:
 *  post:
 *    tags: [Github]
 *    description: Use to push changes to a specific repository
 *    parameters:
 *      - name: repoName
 *        description: Name of the repository
 *        in: path
 *        required: true
 *        type: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post(apiName + '/github/push/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const repoPath = path.join(__dirname, 'assets', 'repositories', repoName);

  try {
    const { stdout, stderr } = await exec('git push origin', { cwd: repoPath });
    if (stderr) {
      console.log('Git push stderr:', stderr);
    }
    res.json({ message: 'Changes pushed successfully', stdout, stderr });
  } catch (err) {
    console.error('Error executing git command:', err);
    res.status(500).send('Error executing git command: ' + err.message);
  }
});
/**
 * @swagger
 * /api/convertYaml:
 *  post:
 *    tags: [tester]
 *    description: Use to convert YAML to JSON
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post('/api/convertYaml', async (req, res) => {
  try {
    const data = yaml.load(req.body.yaml);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid YAML format' });
  }
});
app.get('/api', (req, res) => {
  res.redirect('/api-docs');
});

app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});
app.listen(6012, () => console.log('Server is running on port 6012'));
