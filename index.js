const express = require('express');
const fs = require('fs');
const path = require('path');
const fileUpload = require("express-fileupload");



const app = express();
app.use(fileUpload());

const uploadFile = __dirname + "/public/uploads/"


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post("/upload", function (req, res) {
    if (req.files && Object.keys(req.files).length !== 0) {

        const uploadedFile = req.files.file;

        console.log(`Received file ${uploadedFile.name}`);

        // Upload path
        let uploadPath = uploadFile + uploadedFile.name;

        if (fs.existsSync(uploadPath)) {
            let nb = 1;
            while (fs.existsSync(uploadPath)) {
                uploadPath = uploadFile + nb + "_" + uploadedFile.name;
                nb++;
            }
        }

        // To save the file using mv() function
        uploadedFile.mv(uploadPath, function (err) {
            if (err) {
                console.log(err);
                res.send("Failed !!");
            } else {
                res.redirect('/list?success=true');
            }
        });
    } else res.send("No file uploaded !!");
});

app.get('/list', (req, res) => {
    const uploadDir = './public/uploads';
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        const html = `
        <html>
          <head>
            <title>Uploaded Files</title>
            <link rel="stylesheet" href="/css/style.css">
          </head>
          <body>
            <a href="/">Go to home</a>
            <h1>Uploaded Files</h1>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Preview</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${files
                .map((file) => {
                    const filePath = path.join(uploadDir, file);
                    const isImage = fs.existsSync(filePath) && fs.lstatSync(filePath).isFile() && /(png|jpe?g|gif)$/i.test(filePath);
                    if (!isImage) {
                        return '';
                    }
                    const preview = `<img class="img-preview" src="/uploads/${file}" />`;
                    return `
                      <tr>
                        <td><a href="/uploads/${file}" target="_BLANK">${file}</a></td>
                        <td>${preview}</td>
                        <td>
                          <form method="post" action="/delete">
                            <input type="hidden" name="fileName" value="${file}" />
                            <button type="submit">Delete</button>
                          </form>
                        </td>
                      </tr>
                    `;
                })
                .join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
        res.send(html);
    });
});




app.post('/delete', (req, res) => {
    const filename = req.body.fileName;
    console.log(`Deleting file ${filename}`);

    if (fs.existsSync(uploadFile + filename)) {
        fs.unlinkSync(uploadFile + filename);
        console.log(`Deleted file ${filename}`);
        res.redirect('/list?success=true');
    } else {
        console.log(`File ${filename} does not exist`);
        res.redirect('/list?success=false');
    }

});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/views/404.html');
});

// Start the server
app.listen(4000, () => {
    console.log('Server listening on https://localhost:4000');
});
