/*
Copyright (c) 2012 Takezoe Tomoaki <takezoe_tomoaki@outlook.com>

This software is free software; you can redistribute it and/or modify it under 
the terms of the GNU Lesser General Public License as published by the Free 
Software Foundation, version 3 of the License. This work is distributed 
in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the 
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See
the GNU Lesser General Public License for more details. 

You should have received a copy of the GNU Lesser General Public License 
along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/
/**
 * @name narva
 * @namespace namespace contains all narva stuff. 
 */
(function(narva){
    "use strict";
    var gitteh = require('gitteh'); 
    var async = require('async');
    //--------------------------------------------------------------------------
    /* definitions of private functions. */
    /**
     * Converts the provided pseudo Array object to a real Array object. 
     * @private
     * @param {Object} pseudoArrayObj
     *  The pseudo Array object to be converted to a real Array object. 
     * @param {Integer} pseudoArrayObj.length
     *  The length of pseudo Array object. 
     * @param {Object} pseudoArrayObj.{Integer}i
     *  The i-th element of Pseudo Array object. Accessed as pseudoArrayObj[i].
     * @return {Array}
     *  A real Array object converted from the provided pseudo Array object. 
     * @throws Never throws. 
     */
    narva.pseudoArrayToArray = function(pseudoArrayObj){
        var ret = []; 
        for(var i = 0; i < pseudoArrayObj.length; i ++){
            ret.push(pseudoArrayObj[i]); 
        }
        return ret; 
    }
    /**
     * Checks if the provided pseudo Array object has zero or one elements that is not undefined. 
     * This function is for checking the argument's length is zero or one. 
     * Usage: <code> isNoneMultipleArguments(arguments) </code>
     * @private
     * @param {Object} argsObj
     *  the pseudo Array object to be checked. 
     * @return {Boolean}
     *  Represents whether the provided pseudo Array has zero or one elements that is not undefined. 
     * @throws Never throws. 
     */
    function isNonMultipleArguments(argsObj){
        //convert arguments to a real Array instance. 
        var args = []; 
        for(var i = 0; i < argsObj.length; i ++){
            args.push(argsObj[i]); 
        }
        var filteredArgs = args.filter(function(arg){
                return !(arg === undefined); 
            }
        ); 
        return filteredArgs.length < 2; 
    }
    //--------------------------------------------------------------------------
    /* definition of narva functions. */
    /**
     * Opens a Git repository at the path provided. 
     * @param {String} path
     *  the path of repository to be opened. 
     * @param {Function} callback
     *  the callback fired when repository has been opened, with argument (err, {narva.Commit} commit). 
     * @returns {narva.Repo}
     * @throws If the repository cannot be opened, the callback fired with the argument err of non-falsy value.
     */
    narva.openRepo = function (path, callback) {
        gitteh.openRepository(path, function(err, handle){
            if(err) {
                console.error('failed to open git repository %s, gitteh error: %s', path, err);
                callback(err);
            } else {
                callback(err, new narva.Repo(path, handle));
            }
        });
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Repo. */
    /**
     * @class Represents a Local Git Repository. 
     * @param {String} path 
     *  the Path of the Repository represented by the object.  
     * @param {gitteh.Repository} handle 
     *  the Gitteh handle of the Repository. 
     * @constructor
     * @throws Never throws. 
     */
    narva.Repo = function (path, handle){
        this.path = path; 
        this.handle = handle; 
    };
    /**
     * Acquires the commit represented by the provided sha1 id. 
     * @param {String} id 
     *  The SHA-1 id representing to the commit to be acquired. 
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument (err, {narva.Commit} commit). 
     * @throws If the commit cannot be acquired, the callback fired with the argument err of non-falsy value. 
     */
    narva.Repo.prototype.getCommit = function (id, callback){
        var self = this; 
        this.handle.getCommit(id, function(err, handle){
            if(err) {
                console.error('failed to get git commit %s for git repository %s, gitteh error: %s', 
                    id, 
                    self.path, 
                    err);
                callback(err); 
            } else {
                callback(err, new narva.Commit(self, handle)); 
            }
        }); 
    };
    /**
     * Acquires the tree represented by the provided sha1 id.
     * @param {String} id
     *  The SHA-1 id representing to the tree to be acquired.
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument (err, {narva.Tree} tree). 
     * @throws If the tree cannot be acquired, the callback fired with the arugment err of non-falsy value. 
     */
    narva.Repo.prototype.getTree = function (id, callback) {
        var self = this; 
        this.handle.getTree(id, function(err, handle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s', 
                    id, 
                    self.path, 
                    err); 
                callback(err); 
            } else {
                callback(err, new narva.Tree(self, handle)); 
            }
        }); 
    };
    /**
     * Acquires the reference represented by the provided sha1 id.
     * @param {String} id
     *  The SHA-1 id representing to the reference to be acquired.
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument (err, {narva.Ref} ref).
     * @throws If the reference cannot be acquired, the callback fired with the arugment err of non-falsy value.
     */
    narva.Repo.prototype.getRef = function (id, callback) {
        var self = this;
        this.handle.getReference(id, function(err, refHandle){
            if(err) {
                console.error('failed to get git ref %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new narva.Ref(self, refHandle));
            }
        });
    };
    /**
     * Acquires the branch that has the provided name. 
     * @param {String} name
     *  The name of the branch to be acquired.
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument (err, {narva.Branch} branch).
     * @throws If the reference cannot be acquired, the callback fired with the arugment err of non-falsy value.
     */
    narva.Repo.prototype.getBranch = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, handle){
            if(err) {
                console.error('failed to get git branch %s for git repository %s, gitteh error: %s',
                    name,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new narva.Branch(self, handle));
            }
        });
    };
    /**
     * Tries to acquire the branch that has the provided name.
     * @param {String} name
     *  The name of the branch to be acquired.
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument ({narva.Branch} branch).
     * @throws Never throws. If the branch cannot be acquired, the callback fired with argument branch of undefined. 
     */
    narva.Repo.prototype.tryGetBranch = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, handle){
            if(err) {
                callback();
            } else {
                callback(new narva.Branch(self, handle));
            }
        });
    };
    /**
     * Acquires the guessed-default branch of the repository. 
     * @param callback
     * @throws If the default branch cannot be acquired, the callback fired with argument err of falsy value. 
     */
    narva.Repo.prototype.getDefaultBranch = function(callback){
        var self = this; 
        var foundBranch = false; 
        async.forEach(
            ['master', 'gh-pages', 'default', 'trunk'], 
            function(candidate, forEachCallback){
                if(foundBranch){
                    forEachCallback(null); 
                } else {
                    self.tryGetBranch('refs/heads/' + candidate, function(err, branch){
                        if(err) {
                            forEachCallback(null); 
                        } else {
                            foundBranch = true; 
                            setTimeout(function(){
                                callback(err, branch); 
                            }, 0); 
                            forEachCallback(null); 
                        }
                    }); 
                }
            },
            function(err){
                if(! foundBranch){
                    console.log('default branch cannot be detected. ')
                    callback('default branch cannot be detected. '); 
                }
            }
        ); 
    };
    /**
     * Tries to acquire the tag that has the provided name.
     * @param {String} name
     *  The name of the tag to be acquired.
     * @param {Function} callback
     *  a callback fired when the operation finished, with argument ({narva.Tag} tag).
     * @throws Never throws. If the branch cannot be acquired, the callback fired with argument tag of undefined.
     */
    narva.Repo.prototype.getTag = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, refHandle){
            if(err) {
                console.error('failed to get git ref %s for git repository %s, gitteh error: %s',
                    name,
                    self.path,
                    err);
                callback(err);
            } else {
                self.handle.getTag(refHandle.target, function(err, tagHandle){
                    if(err){
                        console.error('failed to get git tag %s for git repository %s, gitteh error: %s',
                            id,
                            self.path,
                            err);
                        callback(err);
                    } else {
                        callback(err, new narva.Tag(self, tagHandle)); 
                    }
                });
            }
        });
    };
    narva.Repo.prototype.getBlob = function (id, callback) {
        var self = this;
        this.handle.getBlob(id, function(err, handle){
            if(err) {
                console.error('failed to get git blob %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new narva.Blob(self, handle));
            }
        });
    };
    narva.Repo.prototype.getRefs = function (callback) {
        var self = this; 
        this.handle.listReferences(gitteh.GIT_REF_LISTALL, function(err, refIds) {
            if(err) {
                console.error('failed to list git reference for git repository %s, gitteh error: %s', 
                    self.repo.path, err); 
                callback(err); 
            } else {
                var getRefFuncs = refIds.map(function(refId){
                    return function(getRefCallback){
                        self.getRef(refId, function(err, ref){
                            if(err){
                                getRefCallback(err); 
                            } else {
                                getRefCallback(err, ref); 
                            }
                        })
                    }
                }); 
                async.series(
                    getRefFuncs, 
                    function(err, results){
                        if(err){
                            callback(err); 
                        } else {
                            callback(err, results); 
                        }
                    }
                )
            }
        }); 
    }; 
    narva.Repo.prototype.getRefCommits = function(callback){
        var self = this; 
        this.getRefs(function(err, refs){
            if(err){
                callback(err); 
            } else {
                var getCommitFuncs = refs.map(function(ref){
                    return function(getCommitCallback){
                        self.getCommit(ref.target, function(err, commit){
                            if(err){
                                // FIXME: handle this error. 
                                getCommitCallback(null);
                            } else {
                                getCommitCallback(err, commit); 
                            }
                        }); 
                    }; 
                }); 
                async.series(
                    getCommitFuncs, 
                    function(err, results){
                        if(err){
                            callback(err); 
                        } else {
                            // FIXME: handle error commit === undefined.  
                            callback(err, results.filter(function(commit){
                                return commit !== undefined; 
                            })); 
                        }
                    }
                )
            }
        }); 
    }; 
    narva.Repo.prototype.getLastUpdatedTime = function(callback){
        this.getRefCommits(function(err, commits){
            if(err) {
                callback(err); 
            } else if(commits.length == 0){
                // FIXME: currently, if no commit acquired, returns Unix Epoch.  
                callback(err, new Date(0)); 
            } else {
                commits.sort(function(a, b){
                    return a.time - b.time;
                });
                callback(err, commits.pop().time);
            }
        }) 
    }; 
    narva.Repo.prototype.getHistoryCommits = function(since, callback){
        var self = this; 
        /*
        var gitProcess = require('child_process').spawn('git', ['log', since, '--format=%H', '-10'], {cwd: this.path});
        var resultString = ''; 
        gitProcess.stdout.on('data', function(data){
            resultString += data.toString(); 
        }); 
        gitProcess.on('exit', function(code){
            if(code != 0){
                console.error('git log returned non zero exit code %d', code);
                callback(util.format('git log returned non zero exit code %d', code)); 
            } else {
                var commitIds = resultString.split('\n').filter(function(commitId){
                        return commitId !== ''; 
                    }
                ); 
                async.map(
                    commitIds,
                    function(commitId, mapCallback){
                        self.getCommit(commitId, function(err, commit){
                            if(err){
                                // FIXME: handle error
                                mapCallback(null); 
                            } else {
                                mapCallback(err, commit);
                            }
                        }); 
                    }, 
                    function(err, results){
                        callback(err, results); 
                    }
                )
            }
        }); 
        */
        //
        this.handle.createWalker(function(err, walker){
            walker.sort(gitteh.GIT_SORT_TIME); 
            walker.push(since);
            var i = 0; 
            async.whilst(
                function(){
                    return (i ++) < 10; 
                }, 
                function(whilstCallback){
                    console.log('execute next'); 
                    walker.next(function(err, commit){
                        if(err){
                            console.log(err); 
                            i = 10; 
                        } else {
                            console.log(commit); 
                        }
                        whilstCallback(err); 
                    }); 
                }, 
                function(err){
                    callback(err); 
                }
            )
        }); 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Object. */
    /**
     * 
     * @param self
     * @param repo
     * @param handle
     */
    narva.initializeObject = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return; 
        }
        self.repo = repo; 
        self.handle = handle;
        self.id = handle.id;
        
    }; 
    narva.Object = function (repo, handle){
        narva.initializeObject(this, repo, handle); 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Commit. */
    narva.initializeCommit = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeObject(self, repo, handle);
        self.author = new narva.Signature(repo, handle.author);
        self.committer = new narva.Signature(repo, handle.committer);
        self.time = handle.committer.time;
        self.message = handle.message;
    }
    narva.Commit = function (repo, handle){
        narva.initializeCommit(this, repo, handle);
    }; 
    narva.Commit.prototype = new narva.Object(); 
    narva.Commit.prototype.getParents = function(callback){
        var self = this; 
        var parents = this.handle.parents.map(function(handle){
            return new narva.Commit(self.repo, handle); 
        }); 
        callback(null, parents); 
    };
    narva.Commit.prototype.getTree = function(callback){
        this.repo.getTree(this.handle.tree, function(err, tree){
            callback(err, tree); 
        }); 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Tree. */
    narva.initializeTree = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeObject(self, repo, handle); 
        self.entries = handle.entries; 
    }
    narva.Tree = function (repo, handle){
        narva.initializeTree(this, repo, handle);
    };
    narva.Tree.prototype = new narva.Object();
    narva.Tree.prototype.getEntries = function (callback) {
        var self = this; 
        var entries = this.entries.map(function(handle){
            return new narva.TreeEntry(self.repo, handle); 
        }); 
        callback(null, entries); 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Ref. */
    narva.initializeRef = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeObject(self, repo, handle);
        self.name = handle.name;
        self.target = handle.target;
        self.type = handle.type;
    }; 
    narva.Ref = function (repo, handle){
        narva.initializeRef(this, repo, handle);
    };
    narva.Ref.prototype = new narva.Object(); 
    narva.Ref.prototype.getTargetCommit = function(callback){
        this.repo.getCommit(this.target, function(err, commit){
            callback(err, commit); 
        }); 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Branch. */
    narva.initializeBranch = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeRef(self, repo, handle);
    }
    narva.Branch = function (repo, handle){
        narva.initializeBranch(this, repo, handle); 
    };
    narva.Branch.prototype = new narva.Ref();
    //--------------------------------------------------------------------------
    /* definition of class narva.Tag. */
    narva.initializeTag = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeObject(self, repo, handle);
        self.id = handle.id; 
        self.message = handle.message; 
        self.name = handle.name; 
        self.targetId = handle.targetId; 
    }
    narva.Tag = function (repo, handle){
        narva.initializeTag(this, repo, handle);
    };
    narva.Tag.prototype = new narva.Object();
    //--------------------------------------------------------------------------
    /* definition of class narva.Blob. */
    narva.initializeBlob = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        narva.initializeObject(self, repo, handle);
        self.data = handle.data; 
    }
    narva.Blob = function (repo, handle){
        narva.initializeBlob(this, repo, handle);
    };
    narva.Blob.prototype = new narva.Object();
    //--------------------------------------------------------------------------
    // non git objects
    //--------------------------------------------------------------------------
    /* definition of class narva.TreeEntry. */
    narva.initializeTreeEntry = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        self.repo = repo;
        self.handle = handle;
        self.attributes = handle.attributes; 
        self.targetId = handle.id; 
        self.name = handle.name; 

    };
    narva.TreeEntry = function(repo, handle){
        narva.initializeTreeEntry(this, repo, handle); 
    };
    narva.TreeEntry.prototype.getTargetBlob = function(callback){
        this.repo.getBlob(this.targetId, function(err, blob){
            callback(err, blob); 
        }); 
    };
    /**
     * detect whether TreeEntry's target is a directory.  
     * @return {Boolean}
     */
    narva.TreeEntry.prototype.isDirectory = function(){
        var S_IFDIR = 0x4000; 
        return (this.attributes & S_IFDIR) != 0; 
    };
    //--------------------------------------------------------------------------
    /* definition of class narva.Signature. */
    /**
     * 
     * @param {narva.Signature} self 
     *  signature object to be initialized. 
     * @param {narva.Repo} repo 
     *  repository that signature is initialized with. 
     * @param {gitteh.Signature} handle 
     *  Gitteh Signature Object that signature is initialized with. 
     */
    narva.initializeSignature = function(self, repo, handle){
        if(isNonMultipleArguments(arguments)){
            // Default Constructor. 
            return;
        }
        self.repo = repo;
        self.handle = handle;
        self.email = handle.email; 
        self.time = handle.time; 
        self.timeOffset = handle.timeOffset; 
    }
    /**
     * 
     * @param repo
     * @param handle
     * @constructor
     */
    narva.Signature = function(repo, handle){
        narva.initializeSignature(this, repo, handle); 
    }
})(exports); 
