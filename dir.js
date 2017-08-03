var mod_fs = require('fs');

class FilePath {

    static lastPathComponent(dir) {

        var lastIndex = -1;
        var name = undefined;

        while (name === undefined) {

            lastIndex = dir.lastIndexOf("/");
            name = (lastIndex > 0 ? dir.substring(lastIndex + 1, dir.length) : dir);
            if (name.length == 1) {

                dir = dir.substring(0, lastIndex);
                name = undefined;
            }
        }

        return (name);
    }

    static firstPathComponent(dir) {

        var firstIndex = -1;
        var name = undefined;

        while (name === undefined) {

            firstIndex = dir.indexOf("/", 1);
            name = (firstIndex > -1 ? dir.substring(0, firstIndex) : dir);
            if (name.length == 1) {

                dir = dir.substring(firstIndex, dir.length);
                name = undefined;
            }
        }

        return (name);
    }

    static specialPath(path) {

        var specialFolder = FilePath.firstPathComponent(path);
        if (specialFolder === undefined) {
            
            return (path);
        }
        specialFolder = specialFolder.toLowerCase();
        if (specialFolder == "$desktop") {

            path = process.env['HOME'] + "/Desktop" + path.substring(specialFolder.length, path.length);
        }
        else if (specialFolder == "$documents") {

            path = process.env['HOME'] + "/Documents" + path.substring(specialFolder.length, path.length);
        }
        else if (specialFolder == "$home") {

            path = process.env['HOME'] + path.substring(specialFolder.length, path.length);
        }

        return (path);
    }
}

class Directory {

    constructor(path) {

        this.name = FilePath.lastPathComponent(path);
        this.path = path;

        if (this.path.indexOf("$") != -1) {

            this.path = FilePath.specialPath(this.path);
        }

        if (Directory.exists(path)) this.populatePaths();
    }

    static isDirectory(path) { return (mod_fs.statSync(path).isDirectory()); }
    static isFile(path) { return (mod_fs.statSync(path).isFile()); }
    static directories(path) { return (new Directory(path)); }
    static exists(path) { return (mod_fs.existsSync(path) ? this.isDirectory(path) : false); }
    filePath(file) { return (this.path + "/" + file); }
    isDirectory() { return (Directory.isDirectory(this.path)); }
    isFile() { return (Directory.isFile(this.path)); }
    exists() { return (Directory.exists(this.path)); }
    mkdir() { return (mod_fs.mkdirSync(this.path)); }

    populatePaths() {

        var files = mod_fs.readdirSync(this.path);
        var instance = this;

        files.forEach(function(file, index) {

            var stat = mod_fs.statSync(instance.path + "/" + file);
            if (stat.isDirectory()) {

                instance.directories = (instance.directories === undefined ? new Array() : instance.directories);

                var instanceDir = new Directory(instance.path + "/" + file);
                instance.directories[instance.directories.length] = instanceDir;
            }
            else {

                instance.files = (instance.files === undefined ? new Array() : instance.files);
                instance.files[instance.files.length] = file;
            }
        });
    }

    listDirectories(indent) {

        if (this.directories === undefined) {

            return;
        }
        this.directories.forEach(function(directory, index) {

            var i = indent;
            var logString = "";
            while(i-- > 0) {
                logString += "\t";
            }
            directory.listDirectories(++indent);
        });
    }

    listFiles() {

        if (this.files === undefined) {

            return;
        }
        this.files.forEach(function(file, index) {

            console.log("FILE: " + file);
        });
    }

    filesWithExtension(extension, traverse) {

        var results = new Array();
        if (this.files !== undefined) {

            this.files.filter((fileName) => {

                if (fileName.indexOf(extension) != -1) {

                    results[results.length] = this.path + "/" + fileName;
                }
            });
        }

        if (traverse && this.directories !== undefined) {

            this.directories.forEach((directory, index) => {

                var childResults = directory.filesWithExtension(extension, traverse);

                childResults.forEach((childResult, index) => {

                    results[results.length] = childResult;
                });
            });
        }

        return (results);
    }
}

module.exports = {

    Directory: Directory,
    dir: Directory.directories,
    exists: Directory.exists,
    isDirectory: Directory.isDirectory,
    isFile: Directory.isFile,

    FilePath: FilePath,
    lastPathComponent: FilePath.lastPathComponent
}