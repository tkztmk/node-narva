/*
Copyright (c) 2012 Takezoe Tomoaki

This software is free software; you can redistribute it and/or modify it under 
the terms of the GNU Lesser General Public License as published by the Free 
Software Foundation; version 3 of the License. This work is distributed 
in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the 
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See
the GNU Lesser General Public License for more details. 

    You should have received a copy of the GNU Lesser General Public License 
along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

(function(narva){
    "use strict";
    var gitteh = require('gitteh'); 
    var async = require('async');
    /**************************************************************************/
    /* definition of private functions. */
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
    /**************************************************************************/
    /* definition of narva functions. */
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
    /**************************************************************************/
    /* definition of class narva.Repo. */
    narva.Repo = function (path, handle){
        this.path = path; 
        this.handle = handle; 
    }; 
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
    narva.Repo.prototype.getRef = function (id, callback) {
        var self = this;
        this.handle.getReference(id, function(err, refHandle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new narva.Ref(self, refHandle));
            }
        });
    }; 
    narva.Repo.prototype.getBranch = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, handle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    name,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new narva.Branch(self, handle));
            }
        });
    };
    narva.Repo.prototype.tryGetBranch = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, handle){
            if(err) {
                callback(err);
            } else {
                callback(err, new narva.Branch(self, handle));
            }
        });
    };
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
                    callback('default branch cannot be detected. '); 
                }
            }
        ); 
    }; 
    narva.Repo.prototype.getTag = function (name, callback) {
        var self = this;
        this.handle.getReference(name, function(err, refHandle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    name,
                    self.path,
                    err);
                callback(err);
            } else {
                self.handle.getTag(refHandle.target, function(err, tagHandle){
                    if(err){
                        console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
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
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
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
        //
        /*
        this.handle.createWalker(function(err, walker){
            walker.sort(gitteh.GIT_SORT_TIME); 
            walker.push(since);
            var i = 0; 
            async.whilst(
                function(){
                    return (i ++) < 10; 
                }, 
                function(whilstCallback){
                    walker.next(function(err, commit){
                        if(err){
                            console.log(err); 
                            i = 10; 
                        } else {
                            console.log(commit); 
                        }
                    }); 
                }, 
                function(err){
                    callback(err); 
                }
            )
        }); 
        */
    };
    /**************************************************************************/
    /* definition of class narva.Object. */
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
    /**************************************************************************/
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
    /**************************************************************************/
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
    /**************************************************************************/
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
    /**************************************************************************/
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
    /**************************************************************************/
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
    /**************************************************************************/
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
    /**************************************************************************/
    // non git objects
    /**************************************************************************/
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
    narva.TreeEntry.prototype.isDirectory = function(){
        var S_IFDIR = 0x4000; 
        return (this.attributes & S_IFDIR) != 0; 
    };
    /**************************************************************************/
    /* definition of class narva.Signature. */
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
    narva.Signature = function(repo, handle){
        narva.initializeSignature(this, repo, handle); 
    }
})(exports); 
