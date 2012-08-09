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
/*
First, install mocha to the system. 
in Arch Linux, 'nodejs-mocha' package can be found in AUR.
or just install with 'npm install -g mocha'. then:  

npm install # install dependencies
npm install should # test dependency
git clone --mirror https://github.com/visionmedia/should.js.git tmp/should
mocha test.js
 */

var should = require('should'); 
var narva = require(__dirname + '/narva.js'); 

describe('narva test', function(){
    "use strict";
    var testingRepoPath = __dirname + '/tmp/should/'; 
    it('narva.openRepo', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok; 
            }
            done(); 
        }); 
    });
    it('narva.Repo.getCommit', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getCommit('944c4597de42dfbbcd9643bd52082b7f00930039', function(err, commit){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        commit.message.should.equal('Merge pull request #83 from guileen/patch-1\n\nUpdate lib/should.js'); 
                        console.log(commit.handle.committer.time); 
                    }
                    done();
                });
            }
        });
    });
    it('narva.Repo.getBranch', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getBranch('refs/heads/master', function(err, branch){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        //branch.target.should.equal('944c4597de42dfbbcd9643bd52082b7f00930039'); 
                    }
                    done();
                });
            }
        });
    });
    it('narva.Repo.getTag', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getTag('refs/tags/1.1.0', function(err, tag){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        tag.id.should.equal('8d63f002287d1361877222c62083b79b04310678'); 
                    }
                    done();
                });
            }
        });
    });
    it('narva.Commit.getTree', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getCommit('944c4597de42dfbbcd9643bd52082b7f00930039', function(err, commit){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        commit.getTree(function(err, tree){
                            if(err){
                                err.should.not.be.ok
                            }
                            done();
                        });
                    }
                });
            }
        });
    });
    it('narva.Tree.getEntries', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getCommit('944c4597de42dfbbcd9643bd52082b7f00930039', function(err, commit){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        commit.getTree(function(err, tree){
                            if(err){
                                err.should.not.be.ok
                            } else {
                                tree.getEntries(function(err, entries){
                                    var historyMdEntry = false; 
                                    var libEntry = false; 
                                    entries.forEach(function(entry){
                                        if(entry.name == 'History.md') {
                                            historyMdEntry = entry; 
                                        } else if (entry.name == 'lib'){
                                            libEntry = entry; 
                                        }
                                    });
                                    historyMdEntry.should.be.ok; 
                                    libEntry.should.be.ok; 
                                    historyMdEntry.isDirectory().should.be.false; 
                                    libEntry.isDirectory().should.be.true; 
                                    done();
                                }); 
                            }
                        });
                    }
                });
            }
        });
    });
    it('narva.Tree.getBlob', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getCommit('944c4597de42dfbbcd9643bd52082b7f00930039', function(err, commit){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        commit.getTree(function(err, tree){
                            if(err){
                                err.should.not.be.ok
                            } else {
                                tree.getEntries(function(err, entries){
                                    var historyMdEntry = false;
                                    entries.forEach(function(entry){
                                        if(entry.name == 'History.md') {
                                            historyMdEntry = entry;
                                        }
                                    });
                                    historyMdEntry.should.be.ok;
                                    historyMdEntry.isDirectory().should.be.false;
                                    historyMdEntry.getTargetBlob(function(err, blob){
                                        if(err){
                                            err.should.not.be.ok; 
                                        } else {
                                            blob.data.toString().indexOf('\n1.1.0 / 2012-07-30').should.equal(0); 
                                        }
                                        done(); 
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    });
    it('narva.Repo.getRefCommits', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getRefCommits(function(err, commits){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        done();
                    }
                })
            };
        })
    });
    it('narva.Repo.getLastUpdatedTime', function(done){
        narva.openRepo(testingRepoPath, function(err, repo){
            if(err){
                err.should.not.be.ok;
            } else {
                repo.getLastUpdatedTime(function(err, time){
                    if(err){
                        err.should.not.be.ok;
                    } else {
                        console.log(time.toUTCString()); 
                        done();
                    }
                })
            };
        })
    });
}); 
