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
    narva.Repo = function (path, handle){
        this.path = path; 
        this.handle = handle; 
    }; 
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
    narva.initializeObject = function(self, repo, handle){
        self.repo = repo; 
        self.handle = handle;
        if(handle){
            self.id = handle.id;
        }
    }; 
    narva.Object = function (repo, handle){
        narva.initializeObject(this, repo, handle); 
    }; 
    narva.Commit = function (repo, handle){
        narva.initializeObject(this, repo, handle);
        this.author = new narva.Signature(repo, handle.author); 
        this.committer = new narva.Signature(repo, handle.committer); 
        this.time = this.committer.time; 
        this.message = handle.message; 
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
    narva.Tree = function (repo, handle){
        narva.initializeObject(this, repo, handle);
        this.entries = handle.entries; 
    };
    narva.Tree.prototype = new narva.Object();
    narva.Tree.prototype.getEntries = function (callback) {
        var self = this; 
        var entries = this.entries.map(function(handle){
            return new narva.TreeEntry(self.repo, handle); 
        }); 
        callback(null, entries); 
    }; 
    narva.initializeRef = function(self, repo, handle){
        narva.initializeObject(self, repo, handle);
        if(handle){
            self.name = handle.name;
            self.target = handle.target;
            self.type = handle.type;
        }
    }; 
    narva.Ref = function (repo, handle){
        narva.initializeRef(this, repo, handle);
    };
    narva.Ref.getTargetCommit = function(callback){
        this.repo.getCommit(this.target, function(err, commit){
            callback(err, commit); 
        }); 
    };
    narva.Branch = function (repo, handle){
        narva.initializeRef(this, repo, handle); 
    };
    narva.Branch.prototype = new narva.Ref(); 
    narva.Tag = function (repo, handle){
        narva.initializeObject(this, repo, handle);
        this.id = handle.id; 
        this.message = handle.message; 
        this.name = handle.name; 
        this.targetId = handle.targetId; 
    };
    narva.Blob = function (repo, handle){
        narva.initializeObject(this, repo, handle);
        this.data = handle.data; 
    };
    narva.Blob.prototype = new narva.Object();
    // non git objects
    narva.TreeEntry = function(repo, handle){
        this.repo = repo; 
        this.handle = handle; 
        this.attributes = handle.attributes; 
        this.targetId = handle.id; 
        this.name = handle.name; 
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
    narva.Signature = function(repo, handle){
        this.repo = repo; 
        this.handle = handle; 
        this.email = handle.email; 
        this.time = handle.time; 
        this.timeOffset = handle.timeOffset; 
    }
})(exports); 
