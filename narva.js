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
                callback(err, new Commit(self, handle)); 
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
                callback(err, new Tree(self, handle)); 
            }
        }); 
    };
    narva.Repo.prototype.getRef = function (id, callback) {
        var self = this;
        this.handle.getRefernce(id, function(err, handle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new Ref(self, handle));
            }
        });
    }; 
    narva.Repo.prototype.getBranch = function (id, callback) {
        var self = this;
        this.handle.getRefernce(id, function(err, handle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new Branch(self, handle));
            }
        });
    };
    narva.Repo.prototype.getTag = function (id, callback) {
        var self = this;
        this.handle.getRefernce(id, function(err, handle){
            if(err) {
                console.error('failed to get git tree %s for git repository %s, gitteh error: %s',
                    id,
                    self.path,
                    err);
                callback(err);
            } else {
                callback(err, new Tag(self, handle));
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
                callback(err, new Blob(self, handle));
            }
        });
    };
    /**
     * constructs plain narva.Object.
     * @class Base class for Git Objects. 
     */
    narva.Object = function (repo, handle){
        this.repo = repo; 
        this.handle = handle; 
        this.id = handle.id; 
    }; 
    narva.Commit = function (repo, handle){
        this.prototype = new narva.Object(repo, handle); 
        this.author = this.handle.author; 
        this.committer = this.handle.committer; 
        this.message = this.handle.message; 
    }; 
    narva.Commit.prototype.getParents = function(callback){
        var self = this; 
        var parents = this.handle.parents.map(function(handle){
            return new narva.Commit(self.repo, handle); 
        }); 
        callback(null, parents); 
    };
    narva.Commit.prototype.getTree = function(callback){
        callback(null, new narva.Tree(this.repo, this.handle.tree)); 
    };
    narva.Tree = function (repo, handle){
        this.prototype = new narva.Object(repo, handle);
    };
    // narva.Tree.prototype.getEntries
    narva.Ref = function (repo, handle){
        this.prototype = new narva.Object(repo, handle);
        this.name = handle.name; 
        this.target = handle.target; 
        this.type = handle.type; 
    };
    narva.Ref.getTargetCommit = function(callback){
        this.repo.getCommit(this.target, function(err, commit){
            callback(err, commit); 
        }); 
    };
    narva.Branch = function (repo, handle){
        this.prototype = new narva.Ref(repo, handle);
    };
    narva.Tag = function (repo, handle){
        this.prototype = new narva.Ref(repo, handle);
    };
    narva.Blob = function (repo, handle){
        this.prototype = new narva.Object(repo, handle);
        this.data = handle.data; 
    };
    // non git objects
    narva.TreeEntry = function(handle){
        this.handle = handle; 
        this.attribute = handle.attribute; 
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
        return this.attribute & S_IFDIR; 
    };
})(exports); 
