var fs = require('fs'),
    conf = require('../../config'),
    crypto = require('crypto'),
    direc = require('direc'),
    md = require('robotskirt');

function Haroo() {
    var archiveFiles = direc.sort(conf.sourceDir +'/articles', 'mtime'),
        authorFiles = direc.sort(conf.sourceDir +'/authors'),
        authors = {},
        archives = {},
        categories = {},
        tags = {};

    function tokenizer(str) {
        var token = str.split('\n\n'),
            head = JSON.parse(token.shift()),
            body = token.join('\n\n');

        return {
            head: head,
            body: body
        }
    }

    function categorize(file, cates) {
        cates.forEach(function(cate) {
            if(!categories.hasOwnProperty(cate)) {
                categories[cate] = [];
                categories[cate].push(file);
            } else {
                categories[cate].push(file);
            }
        });
    }

    function tagize(file, taglist) {
        taglist.forEach(function(tag) {
            if(!tags.hasOwnProperty(tag)) {
                tags[tag] = [];
                tags[tag].push(file);
            } else {
                tags[tag].push(file);
            }
        });
    }
    
    /**
     * @desc gravatar image url
     * @return String
     */
    function getGravatar(email, size) {
        var size = size || '128',
            md5 = crypto.createHash('md5');
            md5.update(email);

        return "http://www.gravatar.com/avatar/"+ md5.digest('hex') +"?r=pg&s="+ size +".jpg&d=identicon";
    }

    /**
     * @desc load archive & 
     * @param String file
     * @return Object
     */
    function loadArticle(file) {
        var text = fs.readFileSync(file, 'utf8');

        return tokenizer(text);
    }

    /**
     * @desc load author
     * @param String file
     * @return Object
     */
    function loadAuthor(file) {
        var text = fs.readFileSync(file, 'utf8');

        return tokenizer(text);
    }

    function getFileName(file) {
        file = file.split('/');                                                                                                       
        file = file[file.length-1].replace('.markdown', '');

        return file;
    }
    
    function initialize() {
        var archive,
            author,
            id;

        authorFiles.forEach(function(item) {
            file = item._file;
            author = loadAuthor(file);
            author._gravatar = getGravatar(author.head.email);
            authors[author.head.name] = author;
        });

        archiveFiles.forEach(function(item) {
            id = getFileName(item._file);
            archive = archives[id] = loadArticle(item._file);
            categorize(archive, archive.head.categories);
            tagize(file, archive.head.tags);

            archive._file = id;
            archive.author = authors[archive.head.author];
        });
    }

    initialize();
    
    return {
        getMainData: function() {
            return {
                archives: archives,
                categories: categories  
            }
        },
        /**
         * @return Array
         */
        getArchives: function() {
            return archives;
        },

        getArchiveHeader: function(id) {
            return archives[id].head;
        },

        getArchiveMarkdown: function(id) {
            return archives[id].body;
        },

        getArchiveBody: function(id) {
            return md.toHtmlSync(archives[id].body);
        },

        getArchiveCutBody: function(id, cut) {
            var archive = archives[id].body.split('\n\n');
            cut = cut || 5;
            archive = archive.slice(0, cut);
            archive = archive.join('\n\n');

            return md.toHtmlSync(archive);
        }
    };
};

module.exports = new Haroo();
