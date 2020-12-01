var express = require('express');
var router = express.Router();
// var passport = require('passport')
// var LocalStrategy = require('passport-local').Strategy

// var Equipment = require('../models/equipment')
var User = require('../models/user')
var UserSpendTime = require('../models/userspendtime') // 宜靜 2020.05.18
var MapRecord = require('../models/map')
var DictionaryRecord = require('../models/dictionary')
var EquipmentRecord = require('../models/equipment')
var GameMapRecord = require('../models/gameMap')
var testDict = require('../models/dataJson/dictionaryJson')
var testEquip = require('../models/dataJson/equipmentJson')
var math = require('../public/js/math.js')

var multer = require("multer");
// 这里dest对应的值是你要将上传的文件存的文件夹
var upload = multer({ dest: '../public/testImg' });

var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');
var fs = require('fs');
const { log } = require('console');

router.post('/onloadImg', function(req, res, next) {

    console.log(req.body.imgName);
    var imgName = req.body.imgName;
    var imgData = req.body.imgData;
    // console.log(imgData);
    // res.json({user:123});
    // //過濾data:URL
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer.from(base64Data, 'base64');
    fs.writeFile("../codegame-/public/img/GameLevel/" + imgName, dataBuffer, function(err) {
        if (err) {
            return res.json({ state: true, err: err });
        } else {
            return res.json({ state: true, path: "GameLevel/" + imgName });
        }
    });
});

router.get('/kuruma', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('home/kuruma', {
        user: req.user.username
    });
});
router.post('/kuruma', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    }
    /**更新部分 */
    else if (type == "resetEquip") {
        var id = req.user.id;
        User.updateResetEquip(id, function(err, user) {
            if (err) throw err;
            console.log("up   :", user);
            User.getUserById(id, function(err, user) {
                if (err) throw err;
                res.json(user);
            })
        })
    } else if (type == "userMap") {
        MapRecord.getMapByUserID(req.user.id, function(err, map) {
            if (err) throw err;
            var dataMap = [];
            for (let indexM = 0; indexM < map.length; indexM++) {
                const element = map[indexM];
                if (element.check == true && element.postStage == 2) {
                    dataMap.push(element);
                }

            }
            res.json(dataMap);
            // console.log(req.user.id);
            // console.log(map);
            // res.json(map);
        })
    }
    /********* */
    else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    } else if (type == "changePassword") {
        var id = req.user.id
        var password = req.body.password
        var oldPassword = req.body.oldPassword
            // console.log(password,oldPassword);

        User.getUserById(id, function(err, user) {
                if (err) throw err;
                if (user) {
                    // console.log(user);
                    User.comparePassword(oldPassword, user.password, function(err, isMatch) {
                        if (err) throw err
                        if (isMatch) {
                            req.flash('success_msg', 'you are updatePass now')
                            User.updatePassword(user.username, password, function(err, user) {
                                if (err) throw err;
                                // console.log("update :", user);
                            })
                            req.session.updatePassKey = null;
                            return res.json({ responce: 'sucesss' });
                        } else {
                            return res.json({ responce: 'failPassUndifine' });
                        }
                    })
                } else {
                    return res.json({ responce: 'error' });
                }
            })
            // res.redirect('/login')
    } else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);

        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else if (type == "updateDict") {
        var dictType = req.body.dictType
        var dictNum = req.body.dictNum
        var dictValue = req.body.dictValue
        console.log(dictType, dictNum, dictValue);
        DictionaryRecord.getDictionary(function(err, dict) {
            if (err) throw err;
            var typeIndex = 0;
            for (let index = 0; index < dict.length; index++) {
                var element = dict[index];
                if (element.type == dictType) {
                    element.element[dictNum].value = dictValue;
                    typeIndex = index;
                    break;
                    // console.log(element);

                }
            }
            DictionaryRecord.updateDictionaryByType(dict[typeIndex].type, dict[typeIndex].element, function(err, dictResult) {
                if (err) throw err;
                res.json({ res: true });
            });
        });
    } else {

    }

});

router.get('/pruss', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('home/pruss', {
        user: req.user.username
    });
});
router.post('/pruss', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "loadmusicData") {
        if (req.session.bkMusicVolumn && req.session.musicLevel && req.session.bkMusicSwitch) {
            req.session.bkMusicVolumn = arseInt(req.body.bkMusicVolumn);
            req.session.bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
            req.session.musicLevel = parseInt(req.body.musicLevel);
            console.log("tstt success");
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(JSON.stringify(scriptData));
        } else {
            console.log("tstt nome");
            scriptData = {
                bkMusicVolumn: 0.1,
                bkMusicSwitch: 1,
                musicLevel: 1
            }
            req.session.bkMusicVolumn = 0.1;
            req.session.bkMusicSwitch = 1;
            req.session.musicLevel = 1;
            res.json(scriptData);

        }

    }
    /**更新部分 */
    else if (type == "resetEquip") {
        var id = req.user.id;
        User.updateResetEquip(id, function(err, user) {
            if (err) throw err;
            console.log("up   :", user);
            User.getUserById(id, function(err, user) {
                if (err) throw err;
                res.json(user);
            })
        })
    } else if (type == "userMap") {
        MapRecord.getMapByUserID(req.user.id, function(err, map) {
            if (err) throw err;
            var dataMap = [];
            for (let indexM = 0; indexM < map.length; indexM++) {
                const element = map[indexM];
                if (element.check == true && element.postStage == 2) {
                    dataMap.push(element);
                }

            }
            res.json(dataMap);
            // console.log(req.user.id);
            // console.log(map);
            // res.json(map);
        })
    }
    /********* */
    else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }


        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    } else if (type == "changePassword") {
        var id = req.user.id
        var password = req.body.password
        var oldPassword = req.body.oldPassword
            // console.log(password,oldPassword);

        User.getUserById(id, function(err, user) {
                if (err) throw err;
                if (user) {
                    // console.log(user);
                    User.comparePassword(oldPassword, user.password, function(err, isMatch) {
                        if (err) throw err
                        if (isMatch) {
                            req.flash('success_msg', 'you are updatePass now')
                            User.updatePassword(user.username, password, function(err, user) {
                                if (err) throw err;
                                // console.log("update :", user);
                            })
                            req.session.updatePassKey = null;
                            return res.json({ responce: 'sucesss' });
                        } else {
                            return res.json({ responce: 'failPassUndifine' });
                        }
                    })
                } else {
                    return res.json({ responce: 'error' });
                }
            })
            // res.redirect('/login')
    } else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);

        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else if (type == "updateDict") {
        var dictType = req.body.dictType
        var dictNum = req.body.dictNum
        var dictValue = req.body.dictValue
        console.log(dictType, dictNum, dictValue);
        DictionaryRecord.getDictionary(function(err, dict) {
            if (err) throw err;
            var typeIndex = 0;
            for (let index = 0; index < dict.length; index++) {
                var element = dict[index];
                if (element.type == dictType) {
                    element.element[dictNum].value = dictValue;
                    typeIndex = index;
                    break;
                    // console.log(element);

                }
            }
            DictionaryRecord.updateDictionaryByType(dict[typeIndex].type, dict[typeIndex].element, function(err, dictResult) {
                if (err) throw err;
                res.json({ res: true });
            });
        });
    } else {

    }

});

router.get('/gameView_text', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('home/gameView_text', {
        user: req.user.username
    });
});
router.post('/gameView_text', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------gameView");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        bkMusicVolumn = 1;
        bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
        musicLevel = parseInt(req.body.musicLevel);
        if (req.session.bkMusicVolumn) {
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(scriptData);
        }

        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }


        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----關卡紀錄 ------
    else if (type == "codeLevelResult" || type == "blockLevelResult") {
        console.log("codeLevelResult");
        var id = req.user.id;
        var empire = req.body.Empire
        var data = {
            level: req.body.level,
            HighestStarNum: req.body.StarNum,
            challengeLog: [{
                submitTime: req.body.submitTime,
                result: req.body.result,
                code: req.body.code,
                srarNum: req.body.StarNum,
                instructionNum: req.body.instructionNum
            }]
        }
        console.log("data:", data);

        User.getUserById(id, function(err, user) {
            if (err) throw err;
            if (empire == "EasyEmpire") {
                var EasyEmpire = user.EasyEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (EasyEmpire.codeHighestLevel == data.level && data.HighestStarNum > 0) {
                    EasyEmpire.codeHighestLevel = parseInt(EasyEmpire.codeHighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = EasyEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (codeLevel[levelnum].HighestStarNum < data.HighestStarNum) {
                        starChange = true;
                        starChangeNum = data.HighestStarNum - EasyEmpire.codeLevel[levelnum].HighestStarNum;
                        EasyEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    EasyEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    EasyEmpire.codeLevel.push(data);
                }
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }
            } else if (empire == "MediumEmpire") {
                var MediumEmpire = user.MediumEmpire
                var starChange = false,
                    starChangeNum = 0;
                if ((MediumEmpire.HighestLevel == data.level || MediumEmpire.HighestLevel <= data.level) && data.HighestStarNum > 0) {
                    MediumEmpire.HighestLevel = parseInt(data.level) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = MediumEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (parseInt(codeLevel[levelnum].HighestStarNum) < parseInt(data.HighestStarNum)) {
                        starChange = true;
                        starChangeNum = parseInt(data.HighestStarNum) - parseInt(MediumEmpire.codeLevel[levelnum].HighestStarNum);
                        MediumEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    MediumEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    MediumEmpire.codeLevel.push(data);
                }
                console.log(MediumEmpire);
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }



            }
        })
    } else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);

        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else if (type == "updateDict") {
        var dictType = req.body.dictType
        var dictNum = req.body.dictNum
        var dictValue = req.body.dictValue
        console.log(dictType, dictNum, dictValue);
        DictionaryRecord.getDictionary(function(err, dict) {
            if (err) throw err;
            var typeIndex = 0;
            for (let index = 0; index < dict.length; index++) {
                var element = dict[index];
                if (element.type == dictType) {
                    element.element[dictNum].value = dictValue;
                    typeIndex = index;
                    break;
                    // console.log(element);

                }
            }
            DictionaryRecord.updateDictionaryByType(dict[typeIndex].type, dict[typeIndex].element, function(err, dictResult) {
                if (err) throw err;
                res.json({ res: true });
            });
        });
    } else {

    }

});


router.get('/gameView_blockly', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('home/gameView_blockly', {
        user: req.user.username
    });
});
router.post('/gameView_blockly', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------gameView");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        bkMusicVolumn = 1;
        bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
        musicLevel = parseInt(req.body.musicLevel);
        if (req.session.bkMusicVolumn) {
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(scriptData);
        }

        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }


        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----暫時的 ------
    //-----關卡紀錄 ------
    else if (type == "blockLevelResult" || type == "codeLevelResult") {
        console.log("codeLevelResult");
        var id = req.user.id;
        var empire = req.body.Empire
        var data = {
            level: req.body.level,
            HighestStarNum: req.body.StarNum,
            challengeLog: [{
                submitTime: req.body.submitTime,
                result: req.body.result,
                code: req.body.code,
                srarNum: req.body.StarNum,
                instructionNum: req.body.instructionNum
            }]
        }
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            if (empire == "EasyEmpire") {
                var EasyEmpire = user.EasyEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (EasyEmpire.codeHighestLevel == data.level && data.HighestStarNum > 0) {
                    EasyEmpire.codeHighestLevel = parseInt(EasyEmpire.codeHighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = EasyEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (codeLevel[levelnum].HighestStarNum < data.HighestStarNum) {
                        starChange = true;
                        starChangeNum = data.HighestStarNum - EasyEmpire.codeLevel[levelnum].HighestStarNum;
                        EasyEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    EasyEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    EasyEmpire.codeLevel.push(data);
                }
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }
            } else if (empire == "MediumEmpire") {
                var MediumEmpire = user.MediumEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (MediumEmpire.HighestLevel == data.level && data.HighestStarNum > 0) {
                    MediumEmpire.HighestLevel = parseInt(MediumEmpire.HighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = MediumEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (parseInt(codeLevel[levelnum].HighestStarNum) < parseInt(data.HighestStarNum)) {
                        starChange = true;
                        starChangeNum = parseInt(data.HighestStarNum) - parseInt(MediumEmpire.codeLevel[levelnum].HighestStarNum);
                        MediumEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    MediumEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    MediumEmpire.codeLevel.push(data);
                }
                console.log(MediumEmpire);
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }



            }
        })
    }
    //-------------------
    else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);

        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else {

    }

});

router.get('/managementModifyMap', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('backstage/managementModifyMap', {
        user: req.user.username
    });
});
router.post('/managementModifyMap', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------gameView");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        bkMusicVolumn = 1;
        bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
        musicLevel = parseInt(req.body.musicLevel);
        if (req.session.bkMusicVolumn) {
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(scriptData);
        }

        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }


        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----暫時的 ------
    //-----關卡紀錄 ------
    else if (type == "blockLevelResult" || type == "codeLevelResult") {
        console.log("codeLevelResult");
        var id = req.user.id;
        var empire = req.body.Empire
        var data = {
            level: req.body.level,
            HighestStarNum: req.body.StarNum,
            challengeLog: [{
                submitTime: req.body.submitTime,
                result: req.body.result,
                code: req.body.code,
                srarNum: req.body.StarNum,
                instructionNum: req.body.instructionNum
            }]
        }
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            if (empire == "EasyEmpire") {
                var EasyEmpire = user.EasyEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (EasyEmpire.codeHighestLevel == data.level && data.HighestStarNum > 0) {
                    EasyEmpire.codeHighestLevel = parseInt(EasyEmpire.codeHighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = EasyEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (codeLevel[levelnum].HighestStarNum < data.HighestStarNum) {
                        starChange = true;
                        starChangeNum = data.HighestStarNum - EasyEmpire.codeLevel[levelnum].HighestStarNum;
                        EasyEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    EasyEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    EasyEmpire.codeLevel.push(data);
                }
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }
            } else if (empire == "MediumEmpire") {
                var MediumEmpire = user.MediumEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (MediumEmpire.HighestLevel == data.level && data.HighestStarNum > 0) {
                    MediumEmpire.HighestLevel = parseInt(MediumEmpire.HighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = MediumEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (parseInt(codeLevel[levelnum].HighestStarNum) < parseInt(data.HighestStarNum)) {
                        starChange = true;
                        starChangeNum = parseInt(data.HighestStarNum) - parseInt(MediumEmpire.codeLevel[levelnum].HighestStarNum);
                        MediumEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    MediumEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    MediumEmpire.codeLevel.push(data);
                }
                console.log(MediumEmpire);
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }



            }
        })
    }
    //-------------------
    else {

    }

});

/*以下測試檔*/
router.get('/managementModifyMapTest', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    res.render('backstage/managementModifyMapTest', {
        user: req.user.username
    });
});
router.post('/managementModifyMapTest', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------gameView");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        bkMusicVolumn = 1;
        bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
        musicLevel = parseInt(req.body.musicLevel);
        if (req.session.bkMusicVolumn) {
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(scriptData);
        }

        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }


        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----暫時的 ------
    //-----關卡紀錄 ------
    else if (type == "blockLevelResult" || type == "codeLevelResult") {
        console.log("codeLevelResult");
        var id = req.user.id;
        var empire = req.body.Empire
        var data = {
            level: req.body.level,
            HighestStarNum: req.body.StarNum,
            challengeLog: [{
                submitTime: req.body.submitTime,
                result: req.body.result,
                code: req.body.code,
                srarNum: req.body.StarNum,
                instructionNum: req.body.instructionNum
            }]
        }
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            if (empire == "EasyEmpire") {
                var EasyEmpire = user.EasyEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (EasyEmpire.codeHighestLevel == data.level && data.HighestStarNum > 0) {
                    EasyEmpire.codeHighestLevel = parseInt(EasyEmpire.codeHighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = EasyEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (codeLevel[levelnum].HighestStarNum < data.HighestStarNum) {
                        starChange = true;
                        starChangeNum = data.HighestStarNum - EasyEmpire.codeLevel[levelnum].HighestStarNum;
                        EasyEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    EasyEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    EasyEmpire.codeLevel.push(data);
                }
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateEasyEmpireById(id, EasyEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }
            } else if (empire == "MediumEmpire") {
                var MediumEmpire = user.MediumEmpire
                var starChange = false,
                    starChangeNum = 0;
                if (MediumEmpire.HighestLevel == data.level && data.HighestStarNum > 0) {
                    MediumEmpire.HighestLevel = parseInt(MediumEmpire.HighestLevel) + 1;
                    starChange = true;
                    starChangeNum = data.HighestStarNum;
                }
                var codeLevel = MediumEmpire.codeLevel
                var level = false,
                    levelnum = 0;
                for (var i = 0; i < codeLevel.length; i++) {
                    if (codeLevel[i].level == data.level) {
                        level = true;
                        levelnum = i;
                        break;
                    }
                }
                if (level) {
                    if (parseInt(codeLevel[levelnum].HighestStarNum) < parseInt(data.HighestStarNum)) {
                        starChange = true;
                        starChangeNum = parseInt(data.HighestStarNum) - parseInt(MediumEmpire.codeLevel[levelnum].HighestStarNum);
                        MediumEmpire.codeLevel[levelnum].HighestStarNum = data.HighestStarNum;

                    }
                    MediumEmpire.codeLevel[levelnum].challengeLog.push(data.challengeLog[0]);
                } else {
                    MediumEmpire.codeLevel.push(data);
                }
                console.log(MediumEmpire);
                if (starChange) {
                    var starNum = user.starNum;
                    starNum = parseInt(starNum) + parseInt(starChangeNum);
                    User.updateStarNumById(id, starNum, function(err, level) {
                        if (err) throw err;
                        User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                            if (err) throw err;
                            User.getUserById(id, function(err, user) {
                                if (err) throw err;
                                res.json(user);

                            })
                        })
                    })
                } else {
                    User.updateMediumEmpireById(id, MediumEmpire, function(err, level) {
                        if (err) throw err;
                        User.getUserById(id, function(err, user) {
                            if (err) throw err;
                            res.json(user);

                        })
                    })
                }



            }
        })
    }
    //-------------------
    else {

    }

});
/*到此結束*/

router.get('/managementUser', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    if (req.user.isadmin == false) { //如有其他管理者 在這加
        res.redirect('/login')
    }
    res.render('backstage/managementUser', {
        user: req.user.username
    });
});
router.post('/managementUser', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "LoadUser") {
        User.getUser(req.user.id, function(err, users) {
            if (err) throw err;
            res.json(users);
        })
    } else if (type == "changeUserStatus") {
        var userstatus = req.body.userstatus;
        var userId = req.body.userId;
        User.updateUserStatus(userId, userstatus, function(err, users) {
            if (err) throw err;
            res.json(users);
        })
    }

});


// 以下宜靜 2020.05.18
router.get('/managementRFMP', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    if (!(req.user.username == "NKUSTCCEA" || req.user.username == "teacher")) { //如有其他管理者 在這加
        res.redirect('/login')
    }
    res.render('backstage/managementRFMP', {
        user: req.user.username
    });
});

var UserRFMP = []; // 陣列裡中每一筆資料存 [玩家信箱,R數據,F數據,M數據,P數據,R評分,F評分,M評分,P評分,R值,F值,M值,P值,學習者類型,R%,F%,M%,P%]
//                                        [   0   ,  1  ,  2 ,  3  ,  4  ,  5  ,  6  , 7  ,  8  , 9 , 10,11, 12 ,    13   ,14,15,16,17]
var Rpercent, Fpercent, Mpercent, Ppercent;
var Rhavedata = [],
    Fhavedata = [],
    Mhavedata = [],
    Phavedata = []; // 只將有記錄的人的記錄丟進去 // 2020.05.17
var Rday;
var RFtaskStack = [];
var GWOSize = 12,
    RFMPweight = 4,
    PSOSize = 12;
var GWO = []; // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心, 分群人數,持續型人數,潛力型人數,衝刺型人數,扶持型人數,關懷型人數,不在區間內人數]
//                                 [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8     ,    9    ,     10  ,    11   ,    12   ,    13    ,     14  ,    15   ,      16     ]
var PSO_init = []; // 粒子群演算法陣列裡存 [ 速度  ,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心, 分群人數,持續型人數,潛力型人數,衝刺型人數,扶持型人數,關懷型人數,不在區間內人數]
//                                       [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8     ,    9    ,     10  ,    11   ,    12   ,    13    ,     14  ,    15   ,      16     ]
var PSO_personal = []; // 粒子群演算法陣列裡存 [ 速度  ,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心, 分群人數,持續型人數,潛力型人數,衝刺型人數,扶持型人數,關懷型人數,不在區間內人數]
var CurPSO = []; //紀錄目前最好的權重值
var BestPSO = []; //紀錄全域最好的權重值


var BestGWO = []; //紀錄最好的權重值
var GWOalpha = [],
    GWObeta = [],
    GWOdelta = [];
var TypeNumber = [];


router.post('/managementRFMP', function(req, res, next) {
    try {
        var type = req.body.type;
        var startTime = req.body.startTime;
        var endTime = req.body.endTime;
        console.log("type:", type);
        console.log("startTime:", startTime);
        console.log("endTime:", endTime);
        if (type == "init") {
            console.log("-------------------------------   init   -------------------------------");
            var id = req.user.id;
            User.getUserById(id, function(err, user) {
                if (err) throw err;
                res.json(user);
            })
        } else if (type == "Calculate") {
            console.log("-------------------------------   Calculate   -------------------------------");
            Rday = endTime;
            // 將會使用到的變數做初始化
            UserRFMP = [];
            Rpercent = 0, Fpercent = 0, Mpercent = 0, Ppercent = 0;
            Rhavedata = [];
            Fhavedata = [];
            Mhavedata = [];
            Phavedata = [];
            RFtaskStack = [];
            GWO = [];

            //開始計算要顯示的資料的數據
            RFtaskStack.push(
                new Promise((resolve, reject) => {
                    User.getAllUser(function(err, userState) {
                            if (err) throw err;
                            // console.log("玩家人數:",userState.length - 1);
                            var userlen = 0; // 判斷玩家人數，因要扣除管理者

                            // 初始化所有玩家RFMP陣列資料
                            for (let index = 0; index < userState.length; index++) {
                                if (userState[index].email != "NKUSTCCEA@gmail.com") {
                                    UserRFMP[userlen] = [userState[index].email, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ""];
                                    userlen = userlen + 1;
                                }
                            } // 結束初始化所有玩家RFMP陣列資料


                            // R & F數據計算
                            for (let index = 0; index < userState.length; index++) {
                                var FIntervalLen = 0,
                                    FIntervalData = []; // 紀錄 管理者所設定的時間內登入次數以及登入時間資料
                                if (userState[index].Logintime.length) { // 如果userState[index]此玩家有登入資料
                                    for (let i = 0; i < UserRFMP.length; i++) {
                                        if (userState[index].email == UserRFMP[i][0]) {
                                            var Login = userState[index].Logintime.length;
                                            for (let j = 0; j < Login; j++) { // 只抓存管理者所設定的時間內的資料
                                                if ((userState[index].Logintime[j] > startTime) && (userState[index].Logintime[j] < endTime)) {
                                                    FIntervalLen = FIntervalLen + 1;
                                                    FIntervalData.push(userState[index].Logintime[j]);
                                                }
                                            }
                                            if (FIntervalLen != 0) {
                                                var RInterval = FIntervalData[FIntervalLen - 1].getTime();
                                                var Rsub = (Rday - RInterval) / 1000 / 60 / 60 / 24; //換算成天 
                                                UserRFMP[i][1] = 1 / Rsub; // UserRFMP[i][1] 存 Rdata
                                                UserRFMP[i][2] = FIntervalLen; // UserRFMP[i][2] 存 Fdata
                                                Rhavedata.push(UserRFMP[i][1]); // 只將有R_Data的人放進陣列裡 // 2020.05.17
                                                Fhavedata.push(UserRFMP[i][2]); // 只將有F_Data的人放進陣列裡 // 2020.05.17
                                            }
                                        }
                                    }
                                }
                            } // 結束 R & F 數據計算

                            // R數據由大排到小
                            var Rtime = UserRFMP.length;
                            while (Rtime > 1) {
                                Rtime--;
                                for (let i = 0; i < UserRFMP.length - 1; i++) {
                                    var temp;
                                    if (UserRFMP[i][1] < UserRFMP[i + 1][1]) {
                                        temp = UserRFMP[i];
                                        UserRFMP[i] = UserRFMP[i + 1];
                                        UserRFMP[i + 1] = temp;
                                    }
                                }
                            }

                            // 評判是否有最近一次登入紀錄
                            for (let index = 0; index < UserRFMP.length; index++) {
                                if (UserRFMP[index][1] != -1) {
                                    UserRFMP[index][5] = 5;
                                } else if (UserRFMP[index][1] == -1) {
                                    UserRFMP[index][5] = -1; // 不在選取區間內
                                }
                            } // 結束 評判是否有最近一次登入紀錄

                            // 玩家 R值的百分比計算 (%) ， Rhavedata 只記錄有遊玩記錄的人   2020.07.09
                            for (let i = 0; i < userlen; i++) { //要掃描資料庫裡所有玩家
                                if (UserRFMP[i][5] != -1) { // 只計算有遊玩資料的玩家
                                    Rpercent = (Rhavedata.length - (i + 1)) / Rhavedata.length * 100;
                                    UserRFMP[i][14] = Math.round(Rpercent * 100) / 100; // UserRFMP[i][14] 存 R%
                                } else {
                                    // console.log(i,":R的百分比為: 沒有遊玩");
                                    UserRFMP[i][14] = -1; // UserRFMP[i][14] 存 R%
                                }
                            }
                            // 結束玩家 R值的百分比計算 (%)  2020.07.09


                            // 更新使用者Rscore  紀錄R%
                            for (let i = 0; i < UserRFMP.length; i++) {
                                //非同步
                                User.updateRscore(UserRFMP[i][0], UserRFMP[i][14], function(err, record) {
                                    if (err) throw err;
                                })
                            }

                            // F數據由大排到小
                            let Ftime = UserRFMP.length;
                            while (Ftime > 1) {
                                Ftime--;
                                for (let i = 0; i < UserRFMP.length - 1; i++) {
                                    var temp;
                                    if (UserRFMP[i][2] < UserRFMP[i + 1][2]) {
                                        temp = UserRFMP[i];
                                        UserRFMP[i] = UserRFMP[i + 1];
                                        UserRFMP[i + 1] = temp;
                                    }
                                }
                            }

                            // 驗證用
                            // for(let i=0;i < UserRFMP.length; i++){
                            //     console.log("UserRFMP[",i,"][2]:",UserRFMP[i][2]);
                            // }

                            // 評判是否有登入紀錄
                            for (let index = 0; index < UserRFMP.length; index++) {
                                if (UserRFMP[index][2] != -1) {
                                    UserRFMP[index][6] = 5;
                                } else if (UserRFMP[index][2] == -1) {
                                    UserRFMP[index][6] = -1;
                                    // 不在選取區間內
                                }
                            } // 結束 評判是否有登入紀錄

                            // 玩家 F值的百分比計算 (%) ，Fscore 只記錄有遊玩記錄的人   2020.07.09
                            for (let i = 0; i < userlen; i++) { //要掃描資料庫裡所有玩家
                                if (UserRFMP[i][6] != -1) { // 只計算有遊玩資料的玩家
                                    Fpercent = (Fhavedata.length - (i + 1)) / Fhavedata.length * 100;
                                    UserRFMP[i][15] = Math.round(Fpercent * 100) / 100; // UserRFMP[i][15] 存 F%
                                } else {
                                    // console.log(i,":F的百分比為: 沒有遊玩");
                                    UserRFMP[i][15] = -1; // UserRFMP[i][15] 存 F%
                                }
                            }
                            // 結束玩家 F值的百分比計算 (%)  2020.07.09

                            // 更新使用者Fscore  紀錄F%
                            for (let i = 0; i < UserRFMP.length; i++) {
                                User.updateFscore(UserRFMP[i][0], UserRFMP[i][15], function(err, record) {
                                    if (err) throw err;
                                })
                            }

                            // 以下做 M & P的計算
                            UserSpendTime.getAllUserSpendTimeState(function(err, userSpendTimeState) {
                                    if (err) throw err;

                                    // M & P數據計算
                                    for (let index = 0; index < userSpendTimeState.length; index++) {
                                        const MP_process = userSpendTimeState[index];
                                        if ((MP_process.startplay.getTime() > startTime) && (MP_process.endplay.getTime() < endTime)) {
                                            var min = (MP_process.endplay.getTime() - MP_process.startplay.getTime()) / 1000 / 60; //換算成分鐘
                                            for (let index = 0; index < UserRFMP.length; index++) {
                                                if (MP_process.email == UserRFMP[index][0]) {
                                                    UserRFMP[index][3] = UserRFMP[index][3] + min; // UserRFMP[index][3] 存 Mdata
                                                    UserRFMP[index][4] = UserRFMP[index][4] + MP_process.starNumber; // UserRFMP[index][4] 存 Pdata
                                                }
                                            }
                                        }
                                    }

                                    // 去除資料的bug
                                    for (let index = 0; index < UserRFMP.length; index++) {
                                        if (UserRFMP[index][1] == -1) {
                                            UserRFMP[index][3] = -1; // UserRFMP[index][3] 存 Mdata
                                            UserRFMP[index][4] = -1; // UserRFMP[index][4] 存 Pdata
                                        }
                                    }

                                    for (let index = 0; index < UserRFMP.length; index++) {
                                        if (UserRFMP[index][3] != -1) {
                                            Mhavedata.push(UserRFMP[index][3]); // 只將有M_Data的人放進陣列裡 // 2020.05.17
                                        }
                                        if (UserRFMP[index][4] != -1) {
                                            Phavedata.push(UserRFMP[index][4]); // 只將有P_Data的人放進陣列裡 // 2020.05.17
                                        }
                                    }
                                    // 結束M & P數據計算

                                    // M數據由大排到小
                                    let Mtime = UserRFMP.length;
                                    while (Mtime > 1) {
                                        Mtime--;
                                        for (let i = 0; i < UserRFMP.length - 1; i++) {
                                            var temp;
                                            if (UserRFMP[i][3] < UserRFMP[i + 1][3]) {
                                                temp = UserRFMP[i];
                                                UserRFMP[i] = UserRFMP[i + 1];
                                                UserRFMP[i + 1] = temp;
                                            }
                                        }
                                    }

                                    // 驗證用
                                    // for(let i=0;i < UserRFMP.length; i++){
                                    //     console.log("UserRFMP[",i,"][3]:",UserRFMP[i][3]);
                                    // }

                                    // 評判是否有遊玩時間紀錄
                                    for (let index = 0; index < UserRFMP.length; index++) {
                                        if (UserRFMP[index][3] != -1) {
                                            UserRFMP[index][7] = 5;
                                        } else if (UserRFMP[index][3] == -1) {
                                            UserRFMP[index][7] = -1;
                                            // 因不在選取區間內，所以不記錄進Mscore裡
                                        }
                                    } // 結束 評判是否有遊玩時間紀錄


                                    // 玩家 M值的百分比計算 (%) ，Mscore 只記錄有遊玩記錄的人   2020.07.09
                                    for (let i = 0; i < userlen; i++) { //要掃描資料庫裡所有玩家
                                        if (UserRFMP[i][7] != -1) { // 只計算有遊玩資料的玩家
                                            Mpercent = (Mhavedata.length - (i + 1)) / Mhavedata.length * 100;
                                            UserRFMP[i][16] = Math.round(Mpercent * 100) / 100; // UserRFMP[i][16] 存 M%
                                        } else {
                                            // console.log(i,":M的百分比為: 沒有遊玩");
                                            UserRFMP[i][16] = -1; // UserRFMP[i][16] 存 M%
                                        }
                                    }
                                    // 結束玩家 M值的百分比計算 (%)  2020.07.09

                                    // 更新使用者Mscore  紀錄M%
                                    for (let i = 0; i < UserRFMP.length; i++) {
                                        //非同步
                                        User.updateMscore(UserRFMP[i][0], UserRFMP[i][16], function(err, record) {
                                            if (err) throw err;
                                        })
                                    }

                                    // P數據由大排到小
                                    let Ptime = UserRFMP.length;
                                    while (Ptime > 1) {
                                        Ptime--;
                                        for (let i = 0; i < UserRFMP.length - 1; i++) {
                                            var temp;
                                            if (UserRFMP[i][4] < UserRFMP[i + 1][4]) {
                                                temp = UserRFMP[i];
                                                UserRFMP[i] = UserRFMP[i + 1];
                                                UserRFMP[i + 1] = temp;
                                            }
                                        }
                                    }

                                    // 驗證用
                                    // for(let i=0;i < UserRFMP.length; i++){
                                    //     console.log("UserRFMP[",i,"][4]:",UserRFMP[i][4]);
                                    // }

                                    // 評判是否有積分紀錄
                                    for (let index = 0; index < UserRFMP.length; index++) {
                                        if (UserRFMP[index][4] != -1) {
                                            UserRFMP[index][8] = 5;
                                        } else if (UserRFMP[index][4] == -1) {
                                            UserRFMP[index][8] = -1;
                                            // 因不在選取區間內，所以不記錄進Pscore裡
                                        }
                                    } // 結束 評判是否有積分紀錄


                                    // 玩家 P值的百分比計算 (%) ，Pscore 只記錄有遊玩記錄的人   2020.07.09
                                    for (let i = 0; i < userlen; i++) { //要掃描資料庫裡所有玩家
                                        if (UserRFMP[i][8] != -1) { // 只計算有遊玩資料的玩家
                                            Ppercent = (Phavedata.length - (i + 1)) / Phavedata.length * 100;
                                            UserRFMP[i][17] = Math.round(Ppercent * 100) / 100; // UserRFMP[i][17] 存 P%
                                        } else {
                                            // console.log(i,":P的百分比為: 沒有遊玩");
                                            UserRFMP[i][17] = -1; // UserRFMP[i][17] 存 P%
                                        }
                                    }
                                    // 結束玩家 P值的百分比計算 (%)  2020.07.09

                                    // 更新使用者Pscore  紀錄P%
                                    for (let i = 0; i < UserRFMP.length; i++) {
                                        //非同步
                                        User.updatePscore(UserRFMP[i][0], UserRFMP[i][17], function(err, record) {
                                            if (err) throw err;
                                        })
                                    }

                                    // /*   start PSO algorithm   */
                                    // /*     開始    粒子群最佳化演算法   */
                                    // // 隨機產生 PSOSize 組3維初始解+速度

                                    // for (let i = 0; i < PSOSize; i++) {
                                    //     // 產生0~1的亂數 且設成百分比
                                    //     // Math.round(Math.random()*100)/100 是為了產生0~1的初始解，且取到小數第4位，再將其設為百分比
                                    //     PSO_init[i] = [Math.round((Math.random() - 0.5) * 10000) / 100, Math.round(Math.random() * 10000) / 100, Math.round(Math.random() * 10000) / 100, Math.round(Math.random() * 10000) / 100];
                                    //     // console.log(PSO_init[i]);
                                    // }

                                    // BestPSO = [];
                                    // // 進入粒子群最佳化進行迭代
                                    // PSO(1000);
                                    // /*     結束    粒子群最佳化演算法   */
                                    // /*   End PSO algorithm   */


                                    /*   start GWO algorithm   */
                                    /*     開始    灰狼演算法   */
                                    // 隨機產生 GWOSize 組4維初始解

                                    for (let i = 0; i < GWOSize; i++) {
                                        // 產生0~1的亂數 且設成百分比
                                        // Math.round(Math.random()*100)/100 是為了產生0~1的初始解，且取到小數第4位，再將其設為百分比
                                        GWO[i] = [Math.round(Math.random() * 10000) / 100, Math.round(Math.random() * 10000) / 100, Math.round(Math.random() * 10000) / 100, Math.round(Math.random() * 10000) / 100];
                                    }

                                    BestGWO = [];
                                    isLeavy = true; // true表示有萊維飛行   false表示沒有萊維飛行
                                    // 進入灰狼演算法進行迭代
                                    GwoLevy(500);
                                    /*     結束    灰狼演算法   */
                                    /*   End GWO algorithm   */

                                    /* 不跑演算法時在使用的 */
                                    // BestGWO=[50,50,50,50];
                                    // DunnIndexTestRFMP(); 
                                    // DunnIndexTestFMP(); 

                                    console.log("-------------------------------判斷學習者類型-------------------------------");
                                    // console.log("BestGWO:", BestGWO);
                                    // console.log("GWOalpha:", GWOalpha);
                                    // console.log("GWObeta:", GWObeta);
                                    // console.log("GWOdelta:", GWOdelta);

                                    TypeNumber = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                    // 計算 RFMP值 以及 學習者類型判斷
                                    for (let i = 0; i < UserRFMP.length; i++) {
                                        /* GWO 在用的計算 */
                                        if (UserRFMP[i][14] >= BestGWO[0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，BestGWO[0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
                                        else { UserRFMP[i][9] = 0; }
                                        if (UserRFMP[i][15] >= BestGWO[1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，BestGWO[1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
                                        else { UserRFMP[i][10] = 0; }
                                        if (UserRFMP[i][16] >= BestGWO[2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，BestGWO[2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
                                        else { UserRFMP[i][11] = 0; }
                                        if (UserRFMP[i][17] >= BestGWO[3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，BestGWO[3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
                                        else { UserRFMP[i][12] = 0; }

                                        // /* PSO 在用的計算 */
                                        // if (UserRFMP[i][14] >= BestPSO[0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，BestGWO[0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
                                        // else { UserRFMP[i][9] = 0; }
                                        // if (UserRFMP[i][15] >= BestPSO[1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，BestGWO[1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
                                        // else { UserRFMP[i][10] = 0; }
                                        // if (UserRFMP[i][16] >= BestPSO[2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，BestGWO[2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
                                        // else { UserRFMP[i][11] = 0; }
                                        // if (UserRFMP[i][17] >= BestPSO[3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，BestGWO[3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
                                        // else { UserRFMP[i][12] = 0; }

                                        if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
                                        if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
                                        if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
                                        if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值

                                        // // 以下  RFMP模型
                                        // if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "關懷型";  TypeNumber[0] = TypeNumber[0] + 1;  } // 1
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "成就型";  TypeNumber[1] = TypeNumber[1] + 1; } // 2
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "關懷型";  TypeNumber[2] = TypeNumber[2] + 1; } // 3
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "一般型";  TypeNumber[3] = TypeNumber[3] + 1; } // 4
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "關懷型";  TypeNumber[4] = TypeNumber[4] + 1; } // 5
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "一般型";  TypeNumber[5] = TypeNumber[5] + 1; } // 6
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "扶持型";  TypeNumber[6] = TypeNumber[6] + 1; } // 7
                                        // else if(UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "成就型";  TypeNumber[7] = TypeNumber[7] + 1; } // 8
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "關懷型";  TypeNumber[8] = TypeNumber[8] + 1; } // 9
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "成就型";  TypeNumber[9] = TypeNumber[9] + 1; } // 10
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "扶持型";  TypeNumber[10] = TypeNumber[10] + 1; } // 11
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "傑出型";  TypeNumber[11] = TypeNumber[11] + 1; } // 12
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "扶持型";  TypeNumber[12] = TypeNumber[12] + 1; } // 13
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "傑出型";  TypeNumber[13] = TypeNumber[13] + 1; } // 14
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0){    UserRFMP[i][13] = "扶持型";  TypeNumber[14] = TypeNumber[14] + 1; } // 15
                                        // else if(UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1){    UserRFMP[i][13] = "傑出型";  TypeNumber[15] = TypeNumber[15] + 1; } // 16
                                        // else if(UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1){    UserRFMP[i][13] = "不在區間";   } // 不在所選區間內
                                        // else if(UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1){    UserRFMP[i][13] = "無闖關者";   }
                                        // // 以上  RFMP模型

                                        // // 以下  FMP模型
                                        if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                                            UserRFMP[i][13] = "關懷型";
                                            TypeNumber[0] = TypeNumber[0] + 1;
                                        } // 1
                                        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                                            UserRFMP[i][13] = "潛力型";
                                            TypeNumber[1] = TypeNumber[1] + 1;
                                        } // 2
                                        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                                            UserRFMP[i][13] = "扶持型";
                                            TypeNumber[2] = TypeNumber[2] + 1;
                                        } // 3
                                        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                                            UserRFMP[i][13] = "衝刺型";
                                            TypeNumber[3] = TypeNumber[3] + 1;
                                        } // 4
                                        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                                            UserRFMP[i][13] = "扶持型";
                                            TypeNumber[4] = TypeNumber[4] + 1;
                                        } // 5
                                        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                                            UserRFMP[i][13] = "持續型";
                                            TypeNumber[5] = TypeNumber[5] + 1;
                                        } // 6
                                        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                                            UserRFMP[i][13] = "扶持型";
                                            TypeNumber[6] = TypeNumber[6] + 1;
                                        } // 7
                                        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                                            UserRFMP[i][13] = "持續型";
                                            TypeNumber[7] = TypeNumber[7] + 1;
                                        } // 8
                                        else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
                                        else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
                                        // // 以上  FMP模型


                                        // 檢查驗證用的
                                        // if(UserRFMP[i][0] == "C108110121@nkust.edu.tw"){
                                        //     console.log(UserRFMP[i]);
                                        // }
                                    } // 結束計算 RFMP值 以及 學習者類型判斷
                                    // console.log("-------------------------------回到 主程式-------------------------------");
                                    console.log("TypeNumber:", TypeNumber);
                                    console.log("最佳解:");
                                    // console.log(BestPSO);
                                    console.log(BestGWO);
                                    for (let i = 0; i < UserRFMP.length; i++) {
                                        User.updateLearnerType(UserRFMP[i][0], UserRFMP[i][13], function(err, record) {
                                            if (err) throw err;

                                        })
                                    }

                                    // for(let i=0;i < UserRFMP.length; i++){
                                    //     console.log("UserRFMP[",i,"]:",UserRFMP[i]);
                                    // }

                                    resolve();


                                }) // 結束 UserSpendTime.getAllUserSpendTimeState
                        }) // 結束 User.getAllUser
                })
            );

            Promise.all(RFtaskStack).then(function() {
                // res.json({"zzzz":"學妹(X)"}); //?
                res.json(null);
            });


        } else if (type == "LoadUser") {
            console.log("-------------------------------  LoadUser   -------------------------------");
            User.getUser(req.user.id, function(err, users) {
                if (err) throw err;
                res.json(users);
            })
        }
    } catch (error) {
        console.log(error);
    }

});

var interdis = 0,
    intradis = 0; // 記錄群間距離，紀錄到群心距離
var Mininterdis = 0; // 計算每群群心之間的距離取最小
var Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
// 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
var Dunn = 0; // 最終的適存值計算
var GroupNum = 0;
var Outstanding = [0, 0, 0, 0]; // 傑出型
var AchievementType = [0, 0, 0, 0]; // 成就型
var GeneralType = [0, 0, 0, 0]; // 一般型
var protracted = [0, 0, 0, 0]; // 持續型
var potential = [0, 0, 0, 0]; // 潛力型
var Sprint = [0, 0, 0, 0]; // 衝刺型
var Supportive = [0, 0, 0, 0]; // 扶持型
var Caring = [0, 0, 0, 0]; // 關懷型
var Peoplenumber = [0, 0, 0, 0, 0, 0]; // [持續型,潛力型,衝刺型,扶持型,關懷型,不在區間內]
//  紀錄每群人數                      [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]
var isLeavy = true;

// 灰狼演算法 + LevyFlight
function GwoLevy(tMax) {
    // console.log("-------------------------------現在在 GwoLevy-------------------------------");
    BestGWO = [];
    GWOalpha = [];
    GWObeta = [];
    GWOdelta = [];
    // DunnIndexRFMP(); // 計算首次灰狼適存值
    DunnIndexFMP();
    // console.log("-------------------------------在 GwoLevy-------------------------------");

    for (let q = 0; q < GWOalpha.length; q++) {
        BestGWO.push(GWOalpha[q]);
    }
    var Best;
    Best = BestGWO[4];
    // console.log("在初始解的最佳解:", BestGWO);

    // 開始灰狼演算法
    var t = 0,
        tc = 1;
    // tMax = 500;

    /* 原GWO的a */
    // var a = 2 - (2 * t / tMax);
    /* 餘弦定理的a */
    // var a = 2 * Math.cos(t / tMax);
    /* 二次曲線的a */
    var a = 2 - (2 * Math.pow(t / tMax, 2));
    console.log("a = ", a);



    var r1, r2; // r1 & r2 為 隨機的[0,1]值
    var c = [];
    var A = [];

    /* c的r1、A的r2 的3個維度不同參數 */
    for (let i = 0; i < 3; i++) {
        r1 = Math.round(Math.random() * 10000) / 10000;
        r2 = Math.round(Math.random() * 10000) / 10000;
        c[i] = Math.round(2 * r2 * 10000) / 10000;
        A[i] = Math.round(((2 * a * r1) - a) * 10000) / 10000;
    }

    // /* c的r1、A的r2 的3個維度相同參數 */
    // r1 = Math.round(Math.random() * 10000) / 10000;
    // r2 = Math.round(Math.random() * 10000) / 10000;
    // for (let i = 0; i < 3; i++) {
    //     c[i] = Math.round(2 * r2 * 10000) / 10000;
    //     A[i] = Math.round(((2 * a * r1) - a) * 10000) / 10000;
    // }


    var Dalpha = [],
        Dbeta = [],
        Ddelta = []; // alpha(α)、Beta(β)、Delta(δ)
    var X1 = [],
        X2 = [],
        X3 = [];
    var Levy = []; // 萊維飛行
    var step, Levystepsize;
    while (t < tMax) {
        // 更新所有灰狼位置
        // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心]
        //                   [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8     ,    9    ]
        // console.log("t:",t);
        // console.log("tMax:",tMax);
        for (let i = 0; i < GWOSize; i++) {
            // Debug
            // console.log("-------------------------------在 GwoLevy Debug-------------------------------");
            // console.log("第",t,"次的第",i,"隻灰狼的位置調整");
            // console.log("BestGWO:",BestGWO);
            // console.log("GWOalpha:",GWOalpha);
            // console.log("GWObeta:",GWObeta);
            // console.log("GWOdelta:",GWOdelta);
            Levy = [];
            // GWO step 1
            for (let j = 0; j < RFMPweight; j++) {
                Dalpha[j] = Math.round(Math.abs(c[0] * GWOalpha[j] - GWO[i][j]) * 10000) / 10000;
                Dbeta[j] = Math.round(Math.abs(c[1] * GWObeta[j] - GWO[i][j]) * 10000) / 10000;
                Ddelta[j] = Math.round(Math.abs(c[2] * GWOdelta[j] - GWO[i][j]) * 10000) / 10000;
            }
            // console.log("Dalpha:",Dalpha);
            // console.log("Dbeta:",Dbeta);
            // console.log("Ddelta:",Ddelta);
            // GWO step 2
            for (let j = 0; j < RFMPweight; j++) {
                X1[j] = Math.round((GWOalpha[j] - (A[0] * Dalpha[j])) * 10000) / 10000;
                X2[j] = Math.round((GWObeta[j] - (A[1] * Dbeta[j])) * 10000) / 10000;
                X3[j] = Math.round((GWOdelta[j] - (A[2] * Ddelta[j])) * 10000) / 10000;
            }
            // console.log("X1:",X1);
            // console.log("X2:",X2);
            // console.log("X3:",X3);

            if (isLeavy) {
                /* 以下有Levy */
                // GWO step 3 有Levy
                // console.log("有Levy");
                // 計算LevyFlight的RFMP隨機行走值
                for (let z = 0; z < RFMPweight; z++) {
                    step = LevyFlight_Mantegna();
                    //step = LevyFlight_Mantegna(Math.floor(Math.random()*3));
                    Levystepsize = 0.01 * step * (GWO[i][z] - BestGWO[z]);
                    Levy.push(Math.round(Levystepsize * randnm_Gaussion() * 10000000000) / 100000000);

                    // console.log("高斯:",randnm_Gaussion());
                    // console.log("stepP:",step);
                    // console.log("LevystepsizeP:",Levystepsize);
                }

                GWO[i][0] = Math.round((((X1[0] + X2[0] + X3[0]) / 3) + Levy[0]) * 10000) / 10000;
                GWO[i][1] = Math.round((((X1[1] + X2[1] + X3[1]) / 3) + Levy[1]) * 10000) / 10000;
                GWO[i][2] = Math.round((((X1[2] + X2[2] + X3[2]) / 3) + Levy[2]) * 10000) / 10000;
                GWO[i][3] = Math.round((((X1[3] + X2[3] + X3[3]) / 3) + Levy[3]) * 10000) / 10000;

                // console.log("Levy:",Levy);
                /* 以上有Levy */

            } else {
                /* 以下沒有Levy */
                // GWO step 3 沒有Levy
                // console.log("沒有Levy");
                GWO[i][0] = Math.round(((X1[0] + X2[0] + X3[0]) / 3) * 10000) / 10000;
                GWO[i][1] = Math.round(((X1[1] + X2[1] + X3[1]) / 3) * 10000) / 10000;
                GWO[i][2] = Math.round(((X1[2] + X2[2] + X3[2]) / 3) * 10000) / 10000;
                GWO[i][3] = Math.round(((X1[3] + X2[3] + X3[3]) / 3) * 10000) / 10000;
                // console.log("沒有Levy:",GWO[i][0],",",GWO[i][1],",",GWO[i][2],",",GWO[i][3]);
                /* 以上沒有Levy */
            }

            // 權重值超出界線的修正
            for (let z = 0; z < RFMPweight; z++) {
                if (GWO[i][z] > 100) { GWO[i][z] = 100; }
                if (GWO[i][z] < 0) { GWO[i][z] = 0; }
            }
            // console.log("有Levy:",GWO[i][0],",",GWO[i][1],",",GWO[i][2],",",GWO[i][3]);
            // console.log("GWO[",i,"]:",GWO[i]);
        }

        // 更新參數 a、r1、r2、c、A
        // console.log("-------------------------------在 GwoLevy 參數調整-------------------------------");
        t = t + 1;
        /* 原GWO的a */
        // a = 2 - (2 * t / tMax);
        /* 餘弦定理的a */
        // a = 2 * Math.cos(t / tMax);
        /* 二次曲線的a */
        a = 2 - (2 * Math.pow(t / tMax, 2));

        /* c的r1、A的r2 的3個維度不同參數 */
        for (let i = 0; i < 3; i++) {
            r1 = Math.round(Math.random() * 10000) / 10000;
            r2 = Math.round(Math.random() * 10000) / 10000;
            c[i] = Math.round(2 * r2 * 10000) / 10000;
            A[i] = Math.round(((2 * a * r1) - a) * 10000) / 10000;
        }

        // /* c的r1、A的r2 的3個維度相同參數 */
        // r1 = Math.round(Math.random() * 10000) / 10000;
        // r2 = Math.round(Math.random() * 10000) / 10000;
        // for (let i = 0; i < 3; i++) {
        //     c[i] = Math.round(2 * r2 * 10000) / 10000;
        //     A[i] = Math.round(((2 * a * r1) - a) * 10000) / 10000;
        // }

        // 重新計算適存值
        // DunnIndexRFMP();
        DunnIndexFMP();
        // console.log("-------------------------------在 GwoLevy 迭代裡-------------------------------");
        if (GWOalpha[4] > 　BestGWO[4]) { // 判斷此次迭代是否比最佳解好，有 則取代
            // console.log("GWOalpha[4]:", GWOalpha[4]);
            // console.log("BestGWO[4]:", 　BestGWO[4]);
            // BestGWO = GWOalpha;
            BestGWO = [];
            for (let q = 0; q < GWOalpha.length; q++) {
                BestGWO.push(GWOalpha[q]);
            }
        }

        // /* 進行適存值連續迭代時使用的 */
        // if (Best < BestGWO[4]) {
        //     Best = BestGWO[4];
        // } else if (Best == BestGWO[4]) {
        //     tc++;
        //     // console.log("t = " + t);
        // }

        // if (tc == 500) {
        //     break;
        // }
    }

    // console.log("GwoLevy");
    // console.log("-------------------------------結束 GwoLevy-------------------------------");
}

// LevyFlight_MantegnaAlgorithm的計算
function LevyFlight_Mantegna() {
    var Levyalpha = 1.5;
    //var Levyalpha = alpha;

    // 計算 sigmaU、sigmaV
    var sigmaU_1 = math.gamma(Levyalpha + 1) * Math.sin((Math.PI * Levyalpha) / 2);
    var sigmaU_2 = math.gamma((Levyalpha + 1) / 2) * Levyalpha * Math.pow(2, (Levyalpha - 1) / 2);
    var sigmaU = Math.pow((sigmaU_1 / sigmaU_2), 1 / Levyalpha);
    var sigmaV = 1;

    // 計算 步長 step
    var u = randnm_Gaussion() * sigmaU;
    var v = randnm_Gaussion() * sigmaV;
    var step = u / Math.pow(Math.abs(v), 1 / Levyalpha);

    return step;
}

// 使用Box-Muller變換的高斯變數。
function randnm_Gaussion() {
    var u = 0,
        v = 0;
    while (u === 0) u = Math.random(); // 轉換 [0,1) to (0,1)
    while (v === 0) v = Math.random(); // 轉換 [0,1) to (0,1)
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// 粒子群最佳化
function PSO(tMax) {
    var t = 0;
    var c1 = 1.5,
        c2 = 1.5,
        w = 0.9,
        Vmax = 50,
        Vmin = -50;
    var Best,
        tc = 1;
    // tMax = 500;

    BestPSO = [];
    DunnIndexFMP_PSO();
    for (let i = 0; i < PSOSize; i++) {
        PSO_init[i].push(Math.round((Math.random() - 0.5) * 10000) / 100);
        PSO_init[i].push(Math.round((Math.random() - 0.5) * 10000) / 100);
    }

    // 進行粒子個體位置紀錄 & 第一次全域最佳解紀錄
    PSO_personal = [];

    for (let i = 0; i < PSOSize; i++) {
        PSO_personal[i] = [, , , , , , , , , , , , , , , , , , ];
    }

    for (let i = 0; i < PSOSize; i++) {
        var temp = PSO_init[i][0];
        PSO_personal[i][0] = temp;
        // 紀錄個體位置
        for (let j = 1; j < PSO_init[i].length; j++) {
            temp = PSO_init[i][j];
            PSO_personal[i][j] = temp;
        }
        // 紀錄全域最佳解位置
        if (i == 0) {
            for (let j = 0; j < PSO_init[i].length; j++) {
                BestPSO.push(PSO_init[i][j]);
            }
        } else if (PSO_init[i][4] > BestPSO[4]) {
            BestPSO = [];
            for (let j = 0; j < PSO_init[i].length; j++) {
                BestPSO.push(PSO_init[i][j]);
            }
        }
    }
    Best = BestPSO[4];
    // console.log("初始");
    // console.log(PSO_init);
    // console.log("個人");
    // console.log(PSO_personal);
    // console.log("最佳");
    // console.log(BestPSO);
    // 粒子群演算法陣列裡存 [ 速度1  ,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心, 分群人數,持續型人數,潛力型人數,衝刺型人數,扶持型人數,關懷型人數,不在區間內人數,速度2,速度3]
    //                     [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8     ,    9    ,     10  ,    11   ,    12   ,    13    ,     14  ,    15   ,      16       , 17 , 18  ]

    while (t < tMax) {
        for (let i = 0; i < PSOSize; i++) {
            // 更新粒子
            // 更新粒子速度
            var V = PSO_init[i][0];
            var r1 = Math.random(),
                r2 = Math.random();
            PSO_init[i][0] = (w * V) + (c1 * r1 * (PSO_personal[i][1] - PSO_init[i][1])) + (c2 * r2 * (BestPSO[1] - PSO_init[i][1]));
            if (PSO_init[i][0] > Vmax) { PSO_init[i][0] = 50; }
            if (PSO_init[i][0] < Vmin) { PSO_init[i][0] = -50; }

            V = PSO_init[i][17];
            r1 = Math.random();
            r2 = Math.random();
            PSO_init[i][17] = (w * V) + (c1 * r1 * (PSO_personal[i][2] - PSO_init[i][2])) + (c2 * r2 * (BestPSO[2] - PSO_init[i][2]));
            if (PSO_init[i][17] > Vmax) { PSO_init[i][17] = 50; }
            if (PSO_init[i][17] < Vmin) { PSO_init[i][17] = -50; }

            V = PSO_init[i][18];
            r1 = Math.random();
            r2 = Math.random();
            PSO_init[i][18] = (w * V) + (c1 * r1 * (PSO_personal[i][3] - PSO_init[i][3])) + (c2 * r2 * (BestPSO[3] - PSO_init[i][3]));
            if (PSO_init[i][18] > Vmax) { PSO_init[i][18] = 50; }
            if (PSO_init[i][18] < Vmin) { PSO_init[i][18] = -50; }

            // 更新位置
            PSO_init[i][1] = Math.round((PSO_init[i][1] + PSO_init[i][0]) * 100) / 100;
            PSO_init[i][2] = Math.round((PSO_init[i][2] + PSO_init[i][17]) * 100) / 100;
            PSO_init[i][3] = Math.round((PSO_init[i][3] + PSO_init[i][18]) * 100) / 100;


            // 權重值超出界線的修正
            for (let z = 1; z < 4; z++) {
                if (PSO_init[i][z] > 100) { PSO_init[i][z] = 100; }
                if (PSO_init[i][z] < 0) { PSO_init[i][z] = 0; }
            }

        }
        // 結束粒子群位置更新

        // 重新計算適存值
        DunnIndexFMP_PSO();
        // 更新粒子個體最佳位置紀錄 & 全域最佳解紀錄
        for (let i = 0; i < PSOSize; i++) {
            // 紀錄最佳個體位置
            if (PSO_init[i][4] > PSO_personal[i][4]) {
                for (let j = 0; j < PSO_init[i].length; j++) {
                    temp = PSO_init[i][j];
                    PSO_personal[i][j] = temp;
                }
            }

            // 紀錄全域最佳解位置
            if (PSO_init[i][4] > BestPSO[4]) {
                BestPSO = [];
                for (let j = 0; j < PSO_init[i].length; j++) {
                    BestPSO.push(PSO_init[i][j]);
                }
            }
        }
        // 結束粒子群紀錄更新
        // var rand = Math.random();
        // w = 0.5 + (rand / 2);
        w = 0.9 - (((0.9 - 0.4) / tMax) * t)
        t++;

        // /* 適存值連續迭代在用的 */
        // if (Best < BestPSO[4]) {
        //     Best = BestPSO[4];
        // } else if (Best == BestPSO[4]) {
        //     tc++;
        //     // console.log("t = " + t);
        // }

        // if (tc == 500) {
        //     break;
        // }

        // console.log("初始");
        // console.log(PSO_init);
        // console.log("個人");
        // console.log(PSO_personal);
        // console.log("最佳");
        // console.log(BestPSO);
    }
    // 結束迭代

}
// 結束 粒子群最佳化

// 計算粒子群最佳化適存值
function DunnIndexFMP_PSO() {
    TypeNumber = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // 計算適存值
    for (let j = 0; j < PSOSize; j++) {
        GroupNum = 0;
        // 計算 RFMP值 以及 學習者類型判斷
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][14] >= PSO_init[j][0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，PSO_init[j][0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
            else { UserRFMP[i][9] = 0; }
            if (UserRFMP[i][15] >= PSO_init[j][1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，PSO_init[j][1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
            else { UserRFMP[i][10] = 0; }
            if (UserRFMP[i][16] >= PSO_init[j][2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，PSO_init[j][2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
            else { UserRFMP[i][11] = 0; }
            if (UserRFMP[i][17] >= PSO_init[j][3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，PSO_init[j][3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
            else { UserRFMP[i][12] = 0; }

            if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
            if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
            if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
            if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值

            // 以下  FMP模型
            if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[0] = TypeNumber[0] + 1;
            } // 1
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "潛力型";
                TypeNumber[1] = TypeNumber[1] + 1;
            } // 2
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[2] = TypeNumber[2] + 1;
            } // 3
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "衝刺型";
                TypeNumber[3] = TypeNumber[3] + 1;
            } // 4
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[4] = TypeNumber[4] + 1;
            } // 5
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "持續型";
                TypeNumber[5] = TypeNumber[5] + 1;
            } // 6
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[6] = TypeNumber[6] + 1;
            } // 7
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "持續型";
                TypeNumber[7] = TypeNumber[7] + 1;
            } // 8
            else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
            else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
            // 以上  FMP模型

            // 檢查驗證用的
            // if(UserRFMP[i][0] == "C108110121@nkust.edu.tw"){
            //     console.log(UserRFMP[i]);
            // }
        } // 結束計算 RFMP值 以及 學習者類型判斷

        // DunnIdex開始計算fitness
        interdis = 0; // 記錄群間距離
        intradis = 0; // 紀錄到群心距離
        Mininterdis = 0; // 計算每群群心之間的距離取最小
        Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
        // 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
        Dunn = 0; // 最終的適存值計算

        protracted = [0, 0, 0]; // 持續型
        potential = [0, 0, 0]; // 潛力型
        Sprint = [0, 0, 0]; // 衝刺型
        Supportive = [0, 0, 0]; // 扶持型
        Caring = [0, 0, 0]; // 關懷型
        Peoplenumber = [0, 0, 0, 0, 0, 0]; // [持續型,潛力型,衝刺型,扶持型,關懷型,不在區間內]
        //  紀錄每群人數                  [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]

        // 計算每群的群心
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "持續型") {
                protracted[0] = protracted[0] + UserRFMP[i][15]; // 加總 持續型 學習者F%的百分比
                protracted[1] = protracted[1] + UserRFMP[i][16]; // 加總 持續型 學習者M%的百分比
                protracted[2] = protracted[2] + UserRFMP[i][17]; // 加總 持續型 學習者P%的百分比
                Peoplenumber[0] = Peoplenumber[0] + 1; // 加總 持續型 人數
            } else if (UserRFMP[i][13] == "潛力型") {
                potential[0] = potential[0] + UserRFMP[i][15]; // 加總 潛力型 學習者F%的百分比
                potential[1] = potential[1] + UserRFMP[i][16]; // 加總 潛力型 學習者M%的百分比
                potential[2] = potential[2] + UserRFMP[i][17] // 加總 潛力型 學習者P%的百分比
                Peoplenumber[1] = Peoplenumber[1] + 1; // 加總 潛力型 人數
            } else if (UserRFMP[i][13] == "衝刺型") {
                Sprint[0] = Sprint[0] + UserRFMP[i][15]; // 加總 衝刺型 學習者F%的百分比
                Sprint[1] = Sprint[1] + UserRFMP[i][16]; // 加總 衝刺型 學習者M%的百分比
                Sprint[2] = Sprint[2] + UserRFMP[i][17]; // 加總 衝刺型 學習者P%的百分比
                Peoplenumber[2] = Peoplenumber[2] + 1; // 加總 衝刺型 人數
            } else if (UserRFMP[i][13] == "扶持型") {
                Supportive[0] = Supportive[0] + UserRFMP[i][15]; // 加總 扶持型 學習者F%的百分比
                Supportive[1] = Supportive[1] + UserRFMP[i][16]; // 加總 扶持型 學習者M%的百分比
                Supportive[2] = Supportive[2] + UserRFMP[i][17]; // 加總 扶持型 學習者P%的百分比
                Peoplenumber[3] = Peoplenumber[3] + 1; // 加總 扶持型 人數
            } else if (UserRFMP[i][13] == "關懷型") {
                Caring[0] = Caring[0] + UserRFMP[i][15]; // 加總 關懷型 學習者F%的百分比
                Caring[1] = Caring[1] + UserRFMP[i][16]; // 加總 關懷型 學習者M%的百分比
                Caring[2] = Caring[2] + UserRFMP[i][17]; // 加總 關懷型 學習者P%的百分比
                Peoplenumber[4] = Peoplenumber[4] + 1; // 加總 關懷型 人數
            } else {
                Peoplenumber[5] = Peoplenumber[5] + 1; // 加總 不在區間內 人數
            }
        }


        // console.log("現在權重值:[",j,"]:",GWO[j]);
        // console.log("各群人數:",Peoplenumber);

        for (let i = 0; i < 3; i++) {
            // 持續型
            if (Peoplenumber[0] != 0) {
                protracted[i] = protracted[i] / Peoplenumber[0];
                protracted[i] = Math.round(protracted[i] * 100) / 100; // 取四捨五入
            }
            // 潛力型
            if (Peoplenumber[1] != 0) {
                potential[i] = potential[i] / Peoplenumber[1];
                potential[i] = Math.round(potential[i] * 100) / 100; // 取四捨五入
            }
            // 衝刺型
            if (Peoplenumber[2] != 0) {
                Sprint[i] = Sprint[i] / Peoplenumber[2];
                Sprint[i] = Math.round(Sprint[i] * 100) / 100; // 取四捨五入
            }
            // 扶持型
            if (Peoplenumber[3] != 0) {
                Supportive[i] = Supportive[i] / Peoplenumber[3];
                Supportive[i] = Math.round(Supportive[i] * 100) / 100; // 取四捨五入
            }
            // 關懷型
            if (Peoplenumber[4] != 0) {
                Caring[i] = Caring[i] / Peoplenumber[4];
                Caring[i] = Math.round(Caring[i] * 100) / 100; // 取四捨五入
            }
        }
        PSO_init[j][5] = protracted; // PSO_init[j][5] 紀錄 持續型 群心
        PSO_init[j][6] = potential; // PSO_init[j][6] 紀錄 潛力型 群心
        PSO_init[j][7] = Sprint; // PSO_init[j][7] 紀錄 衝刺型 群心
        PSO_init[j][8] = Supportive; // PSO_init[j][8] 紀錄 扶持型 群心
        PSO_init[j][9] = Caring; // PSO_init[j][9] 紀錄 關懷型 群心

        // console.log("-------------------------------計算完群心之後-------------------------------");
        // console.log("現在權重值:[",j,"]:",PSO_init[j]);
        // console.log("各群人數:",Peoplenumber);
        // console.log("持續型:",protracted);
        // console.log("潛力型",potential);
        // console.log("衝刺型",Sprint);
        // console.log("扶持型",Supportive);
        // console.log("關懷型",Caring);

        // 結束計算每群的群心

        // 計算每個點到群心的距離
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "持續型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - protracted[0], 2) + Math.pow(UserRFMP[i][16] - protracted[1], 2) + Math.pow(UserRFMP[i][17] - protracted[2], 2));
            } else if (UserRFMP[i][13] == "潛力型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - potential[0], 2) + Math.pow(UserRFMP[i][16] - potential[1], 2) + Math.pow(UserRFMP[i][17] - potential[2], 2));
            } else if (UserRFMP[i][13] == "衝刺型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Sprint[0], 2) + Math.pow(UserRFMP[i][16] - Sprint[1], 2) + Math.pow(UserRFMP[i][17] - Sprint[2], 2));
            } else if (UserRFMP[i][13] == "扶持型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Supportive[0], 2) + Math.pow(UserRFMP[i][16] - Supportive[1], 2) + Math.pow(UserRFMP[i][17] - Supportive[2], 2));
            } else if (UserRFMP[i][13] == "關懷型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Caring[0], 2) + Math.pow(UserRFMP[i][16] - Caring[1], 2) + Math.pow(UserRFMP[i][17] - Caring[2], 2));
            }

            // 找到群內每一點到群心之間的距離取最大
            if (intradis > Maxintradis) {
                Maxintradis = intradis;
            }

        } // 結束 計算每個點到群心的距離


        // [持續型,潛力型,衝刺型,扶持型,關懷型]
        // [   0  ,  1  ,   2  ,  3  ,   4  ]


        // 計算群間的距離，該群人數不等於0才能做群間計算
        // 持續型 － 潛力型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[1] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - potential[0], 2) + Math.pow(protracted[1] - potential[1], 2) + Math.pow(protracted[2] - potential[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis // 找到每群群心之間的距離取最小
            }
        }
        // 持續型 － 衝刺型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Sprint[0], 2) + Math.pow(protracted[1] - Sprint[1], 2) + Math.pow(protracted[2] - Sprint[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 持續型 － 扶持型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Supportive[0], 2) + Math.pow(protracted[1] - Supportive[1], 2) + Math.pow(protracted[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 持續型 － 關懷型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Caring[0], 2) + Math.pow(protracted[1] - Caring[1], 2) + Math.pow(protracted[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 衝刺型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Sprint[0], 2) + Math.pow(potential[1] - Sprint[1], 2) + Math.pow(potential[2] - Sprint[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 扶持型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Supportive[0], 2) + Math.pow(potential[1] - Supportive[1], 2) + Math.pow(potential[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 關懷型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Caring[0], 2) + Math.pow(potential[1] - Caring[1], 2) + Math.pow(potential[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 衝刺型 － 扶持型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(Sprint[0] - Supportive[0], 2) + Math.pow(Sprint[1] - Supportive[1], 2) + Math.pow(Sprint[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 衝刺型 － 關懷型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Sprint[0] - Caring[0], 2) + Math.pow(Sprint[1] - Caring[1], 2) + Math.pow(Sprint[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 扶持型 － 關懷型 距離
        if (Peoplenumber[3] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Supportive[0] - Caring[0], 2) + Math.pow(Supportive[1] - Caring[1], 2) + Math.pow(Supportive[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }

        // 紀錄群數
        for (let q = 0; q < Peoplenumber.length - 1; q++) {
            if (Peoplenumber[q] != 0) {
                GroupNum = GroupNum + 1;
            }
        }
        PSO_init[j][10] = GroupNum;
        PSO_init[j][11] = Peoplenumber[0];
        PSO_init[j][12] = Peoplenumber[1];
        PSO_init[j][13] = Peoplenumber[2];
        PSO_init[j][14] = Peoplenumber[3];
        PSO_init[j][15] = Peoplenumber[4];
        PSO_init[j][16] = Peoplenumber[5];


        // Dunn = Mininterdis / Maxintradis * ( (GroupNum) / 5);   // Dunn 適存值計算 * 懲罰函式 (所分的群數 / 總群數)
        Dunn = Mininterdis / Maxintradis; // Dunn 適存值計算
        PSO_init[j][4] = Math.round(Dunn * 1000000) / 1000000; // PSO_init[j][4] 存 Dunn適存值 四捨五入



        // console.log("Maxintradis:",Maxintradis);    // 群內最大
        // console.log("Mininterdis:",Mininterdis);  // 群間最小
        // console.log("Maxintradis:",Math.round(Maxintradis*100)/100);    // 群內最大
        // console.log("Mininterdis:",Math.round(Mininterdis*100)/100);  // 群間最小
        // console.log("GroupNum:",GroupNum);
        // console.log("fitness:",Dunn);
        // console.log("現在權重值:[",j,"]:",PSO_init[j]);

    } // 結束適存值計算
} // 結束 DunnIndexFMP 的副程式

// 計算灰狼演算法適存值
function DunnIndexRFMP() {
    // console.log("-------------------------------現在在 Dunn Index-------------------------------");
    TypeNumber = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // 計算適存值
    for (let j = 0; j < GWOSize; j++) {
        //console.log("-------------------------------新的計算-------------------------------");
        GroupNum = 0;
        // 計算 RFMP值 以及 學習者類型判斷
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][14] >= GWO[j][0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，GWO[j][0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
            else { UserRFMP[i][9] = 0; }
            if (UserRFMP[i][15] >= GWO[j][1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，GWO[j][1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
            else { UserRFMP[i][10] = 0; }
            if (UserRFMP[i][16] >= GWO[j][2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，GWO[j][2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
            else { UserRFMP[i][11] = 0; }
            if (UserRFMP[i][17] >= GWO[j][3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，GWO[j][3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
            else { UserRFMP[i][12] = 0; }

            if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
            if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
            if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
            if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值


            // 以下  RFMP模型
            if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[0] = TypeNumber[0] + 1;
            } // 1
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "成就型";
                TypeNumber[1] = TypeNumber[1] + 1;
            } // 2
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[2] = TypeNumber[2] + 1;
            } // 3
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "一般型";
                TypeNumber[3] = TypeNumber[3] + 1;
            } // 4
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[4] = TypeNumber[4] + 1;
            } // 5
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "一般型";
                TypeNumber[5] = TypeNumber[5] + 1;
            } // 6
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[6] = TypeNumber[6] + 1;
            } // 7
            else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "成就型";
                TypeNumber[7] = TypeNumber[7] + 1;
            } // 8
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[8] = TypeNumber[8] + 1;
            } // 9
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "成就型";
                TypeNumber[9] = TypeNumber[9] + 1;
            } // 10
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[10] = TypeNumber[10] + 1;
            } // 11
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "傑出型";
                TypeNumber[11] = TypeNumber[11] + 1;
            } // 12
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[12] = TypeNumber[12] + 1;
            } // 13
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "傑出型";
                TypeNumber[13] = TypeNumber[13] + 1;
            } // 14
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[14] = TypeNumber[14] + 1;
            } // 15
            else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "傑出型";
                TypeNumber[15] = TypeNumber[15] + 1;
            } // 16
            else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
            else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
            // 以上  RFMP模型


            // 檢查驗證用的
            // if(UserRFMP[i][0] == "C108110121@nkust.edu.tw"){
            //     console.log(UserRFMP[i]);
            // }
        } // 結束計算 RFMP值 以及 學習者類型判斷

        // DunnIdex開始計算fitness
        // UserRFMP陣列裡中每一筆資料存 [玩家信箱,R數據,F數據,M數據,P數據,R評分,F評分,M評分,P評分,R值,F值,M值,P值,學習者類型,R%,F%,M%,P%]
        //                             [   0   ,  1  ,  2  ,  3  , 4  ,  5  ,  6  , 7   ,  8  , 9 , 10,11, 12,    13   ,14,15,16,17]
        // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,傑出型群心,成就型群心,一般型群心,扶持型群心,一般型群心]
        //                  [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8   ,    9    ]
        interdis = 0; // 記錄群間距離
        intradis = 0; // 紀錄到群心距離
        Mininterdis = 0; // 計算每群群心之間的距離取最小
        Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
        // 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
        Dunn = 0; // 最終的適存值計算

        Outstanding = [0, 0, 0, 0]; // 傑出型
        AchievementType = [0, 0, 0, 0]; // 成就型
        GeneralType = [0, 0, 0, 0]; // 一般型
        Supportive = [0, 0, 0, 0]; // 扶持型
        Caring = [0, 0, 0, 0]; // 關懷型
        Peoplenumber = [0, 0, 0, 0, 0, 0]; // [傑出型,成就型,一般型,扶持型,關懷型,不在區間內]
        //  紀錄每群人數                  [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]

        // 計算每群的群心
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "傑出型") {
                Outstanding[0] = Outstanding[0] + UserRFMP[i][14]; // 加總 傑出型 學習者R%的百分比
                Outstanding[1] = Outstanding[1] + UserRFMP[i][15]; // 加總 傑出型 學習者F%的百分比
                Outstanding[2] = Outstanding[2] + UserRFMP[i][16]; // 加總 傑出型 學習者M%的百分比
                Outstanding[3] = Outstanding[3] + UserRFMP[i][17]; // 加總 傑出型 學習者P%的百分比
                Peoplenumber[0] = Peoplenumber[0] + 1; // 加總 傑出型 人數
            } else if (UserRFMP[i][13] == "成就型") {
                AchievementType[0] = AchievementType[0] + UserRFMP[i][14]; // 加總 成就型 學習者R%的百分比
                AchievementType[1] = AchievementType[1] + UserRFMP[i][15]; // 加總 成就型 學習者F%的百分比
                AchievementType[2] = AchievementType[2] + UserRFMP[i][16]; // 加總 成就型 學習者M%的百分比
                AchievementType[3] = AchievementType[3] + UserRFMP[i][17] // 加總 成就型 學習者P%的百分比
                Peoplenumber[1] = Peoplenumber[1] + 1; // 加總 成就型 人數
            } else if (UserRFMP[i][13] == "一般型") {
                GeneralType[0] = GeneralType[0] + UserRFMP[i][14]; // 加總 一般型 學習者R%的百分比
                GeneralType[1] = GeneralType[1] + UserRFMP[i][15]; // 加總 一般型 學習者F%的百分比
                GeneralType[2] = GeneralType[2] + UserRFMP[i][16]; // 加總 一般型 學習者M%的百分比
                GeneralType[3] = GeneralType[3] + UserRFMP[i][17]; // 加總 一般型 學習者P%的百分比
                Peoplenumber[2] = Peoplenumber[2] + 1; // 加總 一般型 人數
            } else if (UserRFMP[i][13] == "扶持型") {
                Supportive[0] = Supportive[0] + UserRFMP[i][14]; // 加總 扶持型 學習者R%的百分比
                Supportive[1] = Supportive[1] + UserRFMP[i][15]; // 加總 扶持型 學習者F%的百分比
                Supportive[2] = Supportive[2] + UserRFMP[i][16]; // 加總 扶持型 學習者M%的百分比
                Supportive[3] = Supportive[3] + UserRFMP[i][17]; // 加總 扶持型 學習者P%的百分比
                Peoplenumber[3] = Peoplenumber[3] + 1; // 加總 扶持型 人數
            } else if (UserRFMP[i][13] == "關懷型") {
                Caring[0] = Caring[0] + UserRFMP[i][14]; // 加總 關懷型 學習者R%的百分比
                Caring[1] = Caring[1] + UserRFMP[i][15]; // 加總 關懷型 學習者F%的百分比
                Caring[2] = Caring[2] + UserRFMP[i][16]; // 加總 關懷型 學習者M%的百分比
                Caring[3] = Caring[3] + UserRFMP[i][17]; // 加總 關懷型 學習者P%的百分比
                Peoplenumber[4] = Peoplenumber[4] + 1; // 加總 關懷型 人數
            } else {
                Peoplenumber[5] = Peoplenumber[5] + 1; // 加總 不在區間內 人數
            }
        }


        // console.log("現在權重值:[",j,"]:",GWO[j]);
        // console.log("各群人數:",Peoplenumber);

        for (let i = 0; i < 4; i++) {
            // 傑出型
            if (Peoplenumber[0] != 0) {
                Outstanding[i] = Outstanding[i] / Peoplenumber[0];
                Outstanding[i] = Math.round(Outstanding[i] * 100) / 100; // 取四捨五入
            }
            // 成就型
            if (Peoplenumber[1] != 0) {
                AchievementType[i] = AchievementType[i] / Peoplenumber[1];
                AchievementType[i] = Math.round(AchievementType[i] * 100) / 100; // 取四捨五入
            }
            // 一般型
            if (Peoplenumber[2] != 0) {
                GeneralType[i] = GeneralType[i] / Peoplenumber[2];
                GeneralType[i] = Math.round(GeneralType[i] * 100) / 100; // 取四捨五入
            }
            // 扶持型
            if (Peoplenumber[3] != 0) {
                Supportive[i] = Supportive[i] / Peoplenumber[3];
                Supportive[i] = Math.round(Supportive[i] * 100) / 100; // 取四捨五入
            }
            // 關懷型
            if (Peoplenumber[4] != 0) {
                Caring[i] = Caring[i] / Peoplenumber[4];
                Caring[i] = Math.round(Caring[i] * 100) / 100; // 取四捨五入
            }
        }
        GWO[j][5] = Outstanding; // GWO[j][5] 紀錄 傑出型 群心
        GWO[j][6] = AchievementType; // GWO[j][6] 紀錄 成就型 群心
        GWO[j][7] = GeneralType; // GWO[j][7] 紀錄 一般型 群心
        GWO[j][8] = Supportive; // GWO[j][8] 紀錄 扶持型 群心
        GWO[j][9] = Caring; // GWO[j][9] 紀錄 關懷型 群心

        // console.log("-------------------------------計算完群心之後-------------------------------");
        // console.log("現在權重值:[",j,"]:",GWO[j]);
        // console.log("各群人數:",Peoplenumber);
        // console.log("傑出型:",Outstanding);
        // console.log("成就型",AchievementType);
        // console.log("一般型",GeneralType);
        // console.log("扶持型",Supportive);
        // console.log("關懷型",Caring);

        // 結束計算每群的群心

        // 計算每個點到群心的距離
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "傑出型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Outstanding[0], 2) + Math.pow(UserRFMP[i][15] - Outstanding[1], 2) + Math.pow(UserRFMP[i][16] - Outstanding[2], 2) + Math.pow(UserRFMP[i][17] - Outstanding[3], 2));
            } else if (UserRFMP[i][13] == "成就型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - AchievementType[0], 2) + Math.pow(UserRFMP[i][15] - AchievementType[1], 2) + Math.pow(UserRFMP[i][16] - AchievementType[2], 2) + Math.pow(UserRFMP[i][17] - AchievementType[3], 2));
            } else if (UserRFMP[i][13] == "一般型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - GeneralType[0], 2) + Math.pow(UserRFMP[i][15] - GeneralType[1], 2) + Math.pow(UserRFMP[i][16] - GeneralType[2], 2) + Math.pow(UserRFMP[i][17] - GeneralType[3], 2));
            } else if (UserRFMP[i][13] == "扶持型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Supportive[0], 2) + Math.pow(UserRFMP[i][15] - Supportive[1], 2) + Math.pow(UserRFMP[i][16] - Supportive[2], 2) + Math.pow(UserRFMP[i][17] - Supportive[3], 2));
            } else if (UserRFMP[i][13] == "關懷型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Caring[0], 2) + Math.pow(UserRFMP[i][15] - Caring[1], 2) + Math.pow(UserRFMP[i][16] - Caring[2], 2) + Math.pow(UserRFMP[i][17] - Caring[3], 2));
            }

            // 找到群內每一點到群心之間的距離取最大
            if (intradis > Maxintradis) {
                Maxintradis = intradis;
            }

        } // 結束 計算每個點到群心的距離


        // [傑出型,成就型,一般型,扶持型,關懷型]
        // [   0  ,  1  ,   2  ,  3  ,   4  ]


        // 計算群間的距離，該群人數不等於0才能做群間計算
        // 傑出型 － 成就型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[1] != 0) {
            interdis = Math.sqrt(Math.pow(Outstanding[0] - AchievementType[0], 2) + Math.pow(Outstanding[1] - AchievementType[1], 2) + Math.pow(Outstanding[2] - AchievementType[2], 2) + Math.pow(Outstanding[3] - AchievementType[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis // 找到每群群心之間的距離取最小
            }
        }
        // 傑出型 － 一般型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(Outstanding[0] - GeneralType[0], 2) + Math.pow(Outstanding[1] - GeneralType[1], 2) + Math.pow(Outstanding[2] - GeneralType[2], 2) + Math.pow(Outstanding[3] - GeneralType[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 傑出型 － 扶持型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(Outstanding[0] - Supportive[0], 2) + Math.pow(Outstanding[1] - Supportive[1], 2) + Math.pow(Outstanding[2] - Supportive[2], 2) + Math.pow(Outstanding[3] - Supportive[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 傑出型 － 關懷型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Outstanding[0] - Caring[0], 2) + Math.pow(Outstanding[1] - Caring[1], 2) + Math.pow(Outstanding[2] - Caring[2], 2) + Math.pow(Outstanding[3] - Caring[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 成就型 － 一般型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(AchievementType[0] - GeneralType[0], 2) + Math.pow(AchievementType[1] - GeneralType[1], 2) + Math.pow(AchievementType[2] - GeneralType[2], 2) + Math.pow(AchievementType[3] - GeneralType[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 成就型 － 扶持型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(AchievementType[0] - Supportive[0], 2) + Math.pow(AchievementType[1] - Supportive[1], 2) + Math.pow(AchievementType[2] - Supportive[2], 2) + Math.pow(AchievementType[3] - Supportive[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 成就型 － 關懷型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(AchievementType[0] - Caring[0], 2) + Math.pow(AchievementType[1] - Caring[1], 2) + Math.pow(AchievementType[2] - Caring[2], 2) + Math.pow(AchievementType[3] - Caring[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 一般型 － 扶持型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(GeneralType[0] - Supportive[0], 2) + Math.pow(GeneralType[1] - Supportive[1], 2) + Math.pow(GeneralType[2] - Supportive[2], 2) + Math.pow(GeneralType[3] - Supportive[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 一般型 － 關懷型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(GeneralType[0] - Caring[0], 2) + Math.pow(GeneralType[1] - Caring[1], 2) + Math.pow(GeneralType[2] - Caring[2], 2) + Math.pow(GeneralType[3] - Caring[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 扶持型 － 關懷型 距離
        if (Peoplenumber[3] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Supportive[0] - Caring[0], 2) + Math.pow(Supportive[1] - Caring[1], 2) + Math.pow(Supportive[2] - Caring[2], 2) + Math.pow(Supportive[3] - Caring[3], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }

        // 紀錄群數
        for (let q = 0; q < Peoplenumber.length - 1; q++) {
            if (Peoplenumber[q] != 0) {
                GroupNum = GroupNum + 1;
            }
        }
        GWO[j][10] = GroupNum;
        GWO[j][11] = Peoplenumber[0];
        GWO[j][12] = Peoplenumber[1];
        GWO[j][13] = Peoplenumber[2];
        GWO[j][14] = Peoplenumber[3];
        GWO[j][15] = Peoplenumber[4];
        GWO[j][16] = Peoplenumber[5];


        // Dunn = Mininterdis / Maxintradis * ( (GroupNum) / 5);   // Dunn 適存值計算 * 懲罰函式 (所分的群數 / 總群數)
        Dunn = Mininterdis / Maxintradis; // Dunn 適存值計算
        GWO[j][4] = Math.round(Dunn * 1000000) / 1000000; // GWO[j][4] 存 Dunn適存值 四捨五入



        // console.log("Maxintradis:",Maxintradis);    // 群內最大
        // console.log("Mininterdis:",Mininterdis);  // 群間最小
        // console.log("Maxintradis:",Math.round(Maxintradis*100)/100);    // 群內最大
        // console.log("Mininterdis:",Math.round(Mininterdis*100)/100);  // 群間最小
        // console.log("GroupNum:",GroupNum);
        // console.log("fitness:",Dunn);
        // console.log("現在權重值:[",j,"]:",GWO[j]);

    } // 結束適存值計算


    // 進行適存值的排序，找出 alpha(α)、Beta(β)、Delta(δ)
    var GWOtime = GWOSize;
    while (GWOtime > 1) {
        GWOtime--;
        for (let i = 0; i < GWOSize - 1; i++) {
            var temp;
            if (GWO[i][4] < GWO[i + 1][4]) {
                temp = GWO[i];
                GWO[i] = GWO[i + 1];
                GWO[i + 1] = temp;
            }
        }
    }


    GWOalpha = [];
    GWObeta = [];
    GWOdelta = [];
    for (let q = 0; q < GWO[0].length; q++) {
        GWOalpha.push(GWO[0][q]);
    }
    for (let q = 0; q < GWO[1].length; q++) {
        GWObeta.push(GWO[1][q]);
    }
    for (let q = 0; q < GWO[2].length; q++) {
        GWOdelta.push(GWO[2][q]);
    }


    // GWOalpha = GWO[0];
    // GWObeta = GWO[1];
    // GWOdelta = GWO[2];
    // console.log("-------------------------------在 Dunn Index 的灰狼值-------------------------------");
    // console.log("BestGWO:",BestGWO);
    // console.log("GWOalpha:",GWOalpha);
    // console.log("GWObeta:",GWObeta);
    // console.log("GWOdelta:",GWOdelta);

    // console.log(GWO);




    // console.log("-------------------------------結束 Dunn Index-------------------------------");

} // 結束 DunnIndexRFMP 的副程式

// 原始RFMP權重 (50,50,50,50)
function DunnIndexTestRFMP() {
    // console.log("-------------------------------現在在 Dunn Index-------------------------------");

    // 計算適存值
    TypeNumber = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    //console.log("-------------------------------新的計算-------------------------------");
    GroupNum = 0;
    // 計算 RFMP值 以及 學習者類型判斷
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][14] >= BestGWO[0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，BestGWO[0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
        else { UserRFMP[i][9] = 0; }
        if (UserRFMP[i][15] >= BestGWO[1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，BestGWO[1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
        else { UserRFMP[i][10] = 0; }
        if (UserRFMP[i][16] >= BestGWO[2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，BestGWO[2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
        else { UserRFMP[i][11] = 0; }
        if (UserRFMP[i][17] >= BestGWO[3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，BestGWO[3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
        else { UserRFMP[i][12] = 0; }

        if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
        if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
        if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
        if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值


        // 以下  RFMP模型
        if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "關懷型";
            TypeNumber[0] = TypeNumber[0] + 1;
        } // 1
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "成就型";
            TypeNumber[1] = TypeNumber[1] + 1;
        } // 2
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "關懷型";
            TypeNumber[2] = TypeNumber[2] + 1;
        } // 3
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "一般型";
            TypeNumber[3] = TypeNumber[3] + 1;
        } // 4
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "關懷型";
            TypeNumber[4] = TypeNumber[4] + 1;
        } // 5
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "一般型";
            TypeNumber[5] = TypeNumber[5] + 1;
        } // 6
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[6] = TypeNumber[6] + 1;
        } // 7
        else if (UserRFMP[i][9] == 0 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "成就型";
            TypeNumber[7] = TypeNumber[7] + 1;
        } // 8
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "關懷型";
            TypeNumber[8] = TypeNumber[8] + 1;
        } // 9
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "成就型";
            TypeNumber[9] = TypeNumber[9] + 1;
        } // 10
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[10] = TypeNumber[10] + 1;
        } // 11
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "傑出型";
            TypeNumber[11] = TypeNumber[11] + 1;
        } // 12
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[12] = TypeNumber[12] + 1;
        } // 13
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "傑出型";
            TypeNumber[13] = TypeNumber[13] + 1;
        } // 14
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[14] = TypeNumber[14] + 1;
        } // 15
        else if (UserRFMP[i][9] == 1 && UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "傑出型";
            TypeNumber[15] = TypeNumber[15] + 1;
        } // 16
        else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
        else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
        // 以上  RFMP模型

        // // 檢查驗證用的
        // if(UserRFMP[i][0] == "C108110108@nkust.edu.tw"){
        //     console.log(UserRFMP[i]);
        // }
    } // 結束計算 RFMP值 以及 學習者類型判斷

    // DunnIdex開始計算fitness
    // UserRFMP陣列裡中每一筆資料存 [玩家信箱,R數據,F數據,M數據,P數據,R評分,F評分,M評分,P評分,R值,F值,M值,P值,學習者類型,R%,F%,M%,P%]
    //                             [   0   ,  1  ,  2  ,  3  , 4  ,  5  ,  6  , 7   ,  8  , 9 , 10,11, 12,    13   ,14,15,16,17]
    // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,傑出型群心,成就型群心,一般型群心,扶持型群心,一般型群心]
    //                  [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8   ,    9    ]
    interdis = 0; // 記錄群間距離
    intradis = 0; // 紀錄到群心距離
    Mininterdis = 0; // 計算每群群心之間的距離取最小
    Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
    // 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
    Dunn = 0; // 最終的適存值計算

    Outstanding = [0, 0, 0, 0]; // 傑出型
    AchievementType = [0, 0, 0, 0]; // 成就型
    GeneralType = [0, 0, 0, 0]; // 一般型
    Supportive = [0, 0, 0, 0]; // 扶持型
    Caring = [0, 0, 0, 0]; // 關懷型
    Peoplenumber = [0, 0, 0, 0, 0, 0]; // [傑出型,成就型,一般型,扶持型,關懷型,不在區間內]
    //  紀錄每群人數                  [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]

    // 計算每群的群心
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][13] == "傑出型") {
            Outstanding[0] = Outstanding[0] + UserRFMP[i][14]; // 加總 傑出型 學習者R%的百分比
            Outstanding[1] = Outstanding[1] + UserRFMP[i][15]; // 加總 傑出型 學習者F%的百分比
            Outstanding[2] = Outstanding[2] + UserRFMP[i][16]; // 加總 傑出型 學習者M%的百分比
            Outstanding[3] = Outstanding[3] + UserRFMP[i][17]; // 加總 傑出型 學習者P%的百分比
            Peoplenumber[0] = Peoplenumber[0] + 1; // 加總 傑出型 人數
        } else if (UserRFMP[i][13] == "成就型") {
            AchievementType[0] = AchievementType[0] + UserRFMP[i][14]; // 加總 成就型 學習者R%的百分比
            AchievementType[1] = AchievementType[1] + UserRFMP[i][15]; // 加總 成就型 學習者F%的百分比
            AchievementType[2] = AchievementType[2] + UserRFMP[i][16]; // 加總 成就型 學習者M%的百分比
            AchievementType[3] = AchievementType[3] + UserRFMP[i][17] // 加總 成就型 學習者P%的百分比
            Peoplenumber[1] = Peoplenumber[1] + 1; // 加總 成就型 人數
        } else if (UserRFMP[i][13] == "一般型") {
            GeneralType[0] = GeneralType[0] + UserRFMP[i][14]; // 加總 一般型 學習者R%的百分比
            GeneralType[1] = GeneralType[1] + UserRFMP[i][15]; // 加總 一般型 學習者F%的百分比
            GeneralType[2] = GeneralType[2] + UserRFMP[i][16]; // 加總 一般型 學習者M%的百分比
            GeneralType[3] = GeneralType[3] + UserRFMP[i][17]; // 加總 一般型 學習者P%的百分比
            Peoplenumber[2] = Peoplenumber[2] + 1; // 加總 一般型 人數
        } else if (UserRFMP[i][13] == "扶持型") {
            Supportive[0] = Supportive[0] + UserRFMP[i][14]; // 加總 扶持型 學習者R%的百分比
            Supportive[1] = Supportive[1] + UserRFMP[i][15]; // 加總 扶持型 學習者F%的百分比
            Supportive[2] = Supportive[2] + UserRFMP[i][16]; // 加總 扶持型 學習者M%的百分比
            Supportive[3] = Supportive[3] + UserRFMP[i][17]; // 加總 扶持型 學習者P%的百分比
            Peoplenumber[3] = Peoplenumber[3] + 1; // 加總 扶持型 人數
        } else if (UserRFMP[i][13] == "關懷型") {
            Caring[0] = Caring[0] + UserRFMP[i][14]; // 加總 關懷型 學習者R%的百分比
            Caring[1] = Caring[1] + UserRFMP[i][15]; // 加總 關懷型 學習者F%的百分比
            Caring[2] = Caring[2] + UserRFMP[i][16]; // 加總 關懷型 學習者M%的百分比
            Caring[3] = Caring[3] + UserRFMP[i][17]; // 加總 關懷型 學習者P%的百分比
            Peoplenumber[4] = Peoplenumber[4] + 1; // 加總 關懷型 人數
        } else {
            Peoplenumber[5] = Peoplenumber[5] + 1; // 加總 不在區間內 人數
        }
    }

    for (let i = 0; i < 4; i++) {
        // 傑出型
        if (Peoplenumber[0] != 0) {
            Outstanding[i] = Outstanding[i] / Peoplenumber[0];
            Outstanding[i] = Math.round(Outstanding[i] * 100) / 100; // 取四捨五入
        }
        // 成就型
        if (Peoplenumber[1] != 0) {
            AchievementType[i] = AchievementType[i] / Peoplenumber[1];
            AchievementType[i] = Math.round(AchievementType[i] * 100) / 100; // 取四捨五入
        }
        // 一般型
        if (Peoplenumber[2] != 0) {
            GeneralType[i] = GeneralType[i] / Peoplenumber[2];
            GeneralType[i] = Math.round(GeneralType[i] * 100) / 100; // 取四捨五入
        }
        // 扶持型
        if (Peoplenumber[3] != 0) {
            Supportive[i] = Supportive[i] / Peoplenumber[3];
            Supportive[i] = Math.round(Supportive[i] * 100) / 100; // 取四捨五入
        }
        // 關懷型
        if (Peoplenumber[4] != 0) {
            Caring[i] = Caring[i] / Peoplenumber[4];
            Caring[i] = Math.round(Caring[i] * 100) / 100; // 取四捨五入
        }
    }
    BestGWO[5] = Outstanding; // GWO[j][5] 紀錄 傑出型 群心
    BestGWO[6] = AchievementType; // GWO[j][6] 紀錄 成就型 群心
    BestGWO[7] = GeneralType; // GWO[j][7] 紀錄 一般型 群心
    BestGWO[8] = Supportive; // GWO[j][8] 紀錄 扶持型 群心
    BestGWO[9] = Caring; // GWO[j][9] 紀錄 關懷型 群心

    // console.log("-------------------------------計算完群心之後-------------------------------");
    // console.log("現在權重值:[",j,"]:",GWO[j]);
    // console.log("各群人數:",Peoplenumber);
    // console.log("傑出型:",Outstanding);
    // console.log("成就型",AchievementType);
    // console.log("一般型",GeneralType);
    // console.log("扶持型",Supportive);
    // console.log("關懷型",Caring);

    // 結束計算每群的群心

    // 計算每個點到群心的距離
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][13] == "傑出型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Outstanding[0], 2) + Math.pow(UserRFMP[i][15] - Outstanding[1], 2) + Math.pow(UserRFMP[i][16] - Outstanding[2], 2) + Math.pow(UserRFMP[i][17] - Outstanding[3], 2));
        } else if (UserRFMP[i][13] == "成就型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - AchievementType[0], 2) + Math.pow(UserRFMP[i][15] - AchievementType[1], 2) + Math.pow(UserRFMP[i][16] - AchievementType[2], 2) + Math.pow(UserRFMP[i][17] - AchievementType[3], 2));
        } else if (UserRFMP[i][13] == "一般型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - GeneralType[0], 2) + Math.pow(UserRFMP[i][15] - GeneralType[1], 2) + Math.pow(UserRFMP[i][16] - GeneralType[2], 2) + Math.pow(UserRFMP[i][17] - GeneralType[3], 2));
        } else if (UserRFMP[i][13] == "扶持型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Supportive[0], 2) + Math.pow(UserRFMP[i][15] - Supportive[1], 2) + Math.pow(UserRFMP[i][16] - Supportive[2], 2) + Math.pow(UserRFMP[i][17] - Supportive[3], 2));
        } else if (UserRFMP[i][13] == "關懷型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][14] - Caring[0], 2) + Math.pow(UserRFMP[i][15] - Caring[1], 2) + Math.pow(UserRFMP[i][16] - Caring[2], 2) + Math.pow(UserRFMP[i][17] - Caring[3], 2));
        }

        // 找到群內每一點到群心之間的距離取最大
        if (intradis > Maxintradis) {
            Maxintradis = intradis;
        }

    } // 結束 計算每個點到群心的距離


    // [傑出型,成就型,一般型,扶持型,關懷型]
    // [   0  ,  1  ,   2  ,  3  ,   4  ]


    // 計算群間的距離，該群人數不等於0才能做群間計算
    // 傑出型 － 成就型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[1] != 0) {
        interdis = Math.sqrt(Math.pow(Outstanding[0] - AchievementType[0], 2) + Math.pow(Outstanding[1] - AchievementType[1], 2) + Math.pow(Outstanding[2] - AchievementType[2], 2) + Math.pow(Outstanding[3] - AchievementType[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 傑出型 － 一般型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[2] != 0) {
        interdis = Math.sqrt(Math.pow(Outstanding[0] - GeneralType[0], 2) + Math.pow(Outstanding[1] - GeneralType[1], 2) + Math.pow(Outstanding[2] - GeneralType[2], 2) + Math.pow(Outstanding[3] - GeneralType[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 傑出型 － 扶持型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(Outstanding[0] - Supportive[0], 2) + Math.pow(Outstanding[1] - Supportive[1], 2) + Math.pow(Outstanding[2] - Supportive[2], 2) + Math.pow(Outstanding[3] - Supportive[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 傑出型 － 關懷型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(Outstanding[0] - Caring[0], 2) + Math.pow(Outstanding[1] - Caring[1], 2) + Math.pow(Outstanding[2] - Caring[2], 2) + Math.pow(Outstanding[3] - Caring[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 成就型 － 一般型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[2] != 0) {
        interdis = Math.sqrt(Math.pow(AchievementType[0] - GeneralType[0], 2) + Math.pow(AchievementType[1] - GeneralType[1], 2) + Math.pow(AchievementType[2] - GeneralType[2], 2) + Math.pow(AchievementType[3] - GeneralType[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 成就型 － 扶持型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(AchievementType[0] - Supportive[0], 2) + Math.pow(AchievementType[1] - Supportive[1], 2) + Math.pow(AchievementType[2] - Supportive[2], 2) + Math.pow(AchievementType[3] - Supportive[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 成就型 － 關懷型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(AchievementType[0] - Caring[0], 2) + Math.pow(AchievementType[1] - Caring[1], 2) + Math.pow(AchievementType[2] - Caring[2], 2) + Math.pow(AchievementType[3] - Caring[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 一般型 － 扶持型 距離
    if (Peoplenumber[2] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(GeneralType[0] - Supportive[0], 2) + Math.pow(GeneralType[1] - Supportive[1], 2) + Math.pow(GeneralType[2] - Supportive[2], 2) + Math.pow(GeneralType[3] - Supportive[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 一般型 － 關懷型 距離
    if (Peoplenumber[2] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(GeneralType[0] - Caring[0], 2) + Math.pow(GeneralType[1] - Caring[1], 2) + Math.pow(GeneralType[2] - Caring[2], 2) + Math.pow(GeneralType[3] - Caring[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 扶持型 － 關懷型 距離
    if (Peoplenumber[3] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(Supportive[0] - Caring[0], 2) + Math.pow(Supportive[1] - Caring[1], 2) + Math.pow(Supportive[2] - Caring[2], 2) + Math.pow(Supportive[3] - Caring[3], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }

    // 紀錄群數
    for (let q = 0; q < Peoplenumber.length - 1; q++) {
        if (Peoplenumber[q] != 0) {
            GroupNum = GroupNum + 1;
        }
    }
    BestGWO[10] = GroupNum;
    BestGWO[11] = Peoplenumber[0];
    BestGWO[12] = Peoplenumber[1];
    BestGWO[13] = Peoplenumber[2];
    BestGWO[14] = Peoplenumber[3];
    BestGWO[15] = Peoplenumber[4];
    BestGWO[16] = Peoplenumber[5];


    // Dunn = Mininterdis / Maxintradis * ((GroupNum) / 5);   // Dunn 適存值計算 * 懲罰函式 (所分的群數 / 總群數)
    Dunn = Mininterdis / Maxintradis; // Dunn 適存值計算
    BestGWO[4] = Math.round(Dunn * 1000000) / 1000000; // GWO[j][4] 存 Dunn適存值 四捨五入

} // 結束 DunnIndexTestRFMP 的副程式

// 計算灰狼演算法適存值
function DunnIndexFMP() {
    // 計算適存值
    TypeNumber = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (let j = 0; j < GWOSize; j++) {
        GroupNum = 0;
        // 計算 RFMP值 以及 學習者類型判斷
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][14] >= GWO[j][0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，GWO[j][0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
            else { UserRFMP[i][9] = 0; }
            if (UserRFMP[i][15] >= GWO[j][1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，GWO[j][1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
            else { UserRFMP[i][10] = 0; }
            if (UserRFMP[i][16] >= GWO[j][2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，GWO[j][2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
            else { UserRFMP[i][11] = 0; }
            if (UserRFMP[i][17] >= GWO[j][3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，GWO[j][3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
            else { UserRFMP[i][12] = 0; }

            if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
            if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
            if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
            if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值

            // 以下  FMP模型
            if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "關懷型";
                TypeNumber[0] = TypeNumber[0] + 1;
            } // 1
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "潛力型";
                TypeNumber[1] = TypeNumber[1] + 1;
            } // 2
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[2] = TypeNumber[2] + 1;
            } // 3
            else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "衝刺型";
                TypeNumber[3] = TypeNumber[3] + 1;
            } // 4
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[4] = TypeNumber[4] + 1;
            } // 5
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "持續型";
                TypeNumber[5] = TypeNumber[5] + 1;
            } // 6
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
                UserRFMP[i][13] = "扶持型";
                TypeNumber[6] = TypeNumber[6] + 1;
            } // 7
            else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
                UserRFMP[i][13] = "持續型";
                TypeNumber[7] = TypeNumber[7] + 1;
            } // 8
            else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
            else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
            // 以上  FMP模型

            // 檢查驗證用的
            // if(UserRFMP[i][0] == "C108110121@nkust.edu.tw"){
            //     console.log(UserRFMP[i]);
            // }
        } // 結束計算 RFMP值 以及 學習者類型判斷

        // DunnIdex開始計算fitness
        // UserRFMP陣列裡中每一筆資料存 [玩家信箱,R數據,F數據,M數據,P數據,R評分,F評分,M評分,P評分,R值,F值,M值,P值,學習者類型,R%,F%,M%,P%]
        //                             [   0   ,  1  ,  2  ,  3  , 4  ,  5  ,  6  , 7   ,  8  , 9 , 10,11, 12,    13   ,14,15,16,17]
        // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心]
        //                  [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8   ,    9    ]
        interdis = 0; // 記錄群間距離
        intradis = 0; // 紀錄到群心距離
        Mininterdis = 0; // 計算每群群心之間的距離取最小
        Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
        // 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
        Dunn = 0; // 最終的適存值計算

        protracted = [0, 0, 0]; // 持續型
        potential = [0, 0, 0]; // 潛力型
        Sprint = [0, 0, 0]; // 衝刺型
        Supportive = [0, 0, 0]; // 扶持型
        Caring = [0, 0, 0]; // 關懷型
        Peoplenumber = [0, 0, 0, 0, 0, 0]; // [持續型,潛力型,衝刺型,扶持型,關懷型,不在區間內]
        //  紀錄每群人數                  [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]

        // 計算每群的群心
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "持續型") {
                protracted[0] = protracted[0] + UserRFMP[i][15]; // 加總 持續型 學習者F%的百分比
                protracted[1] = protracted[1] + UserRFMP[i][16]; // 加總 持續型 學習者M%的百分比
                protracted[2] = protracted[2] + UserRFMP[i][17]; // 加總 持續型 學習者P%的百分比
                Peoplenumber[0] = Peoplenumber[0] + 1; // 加總 持續型 人數
            } else if (UserRFMP[i][13] == "潛力型") {
                potential[0] = potential[0] + UserRFMP[i][15]; // 加總 潛力型 學習者F%的百分比
                potential[1] = potential[1] + UserRFMP[i][16]; // 加總 潛力型 學習者M%的百分比
                potential[2] = potential[2] + UserRFMP[i][17] // 加總 潛力型 學習者P%的百分比
                Peoplenumber[1] = Peoplenumber[1] + 1; // 加總 潛力型 人數
            } else if (UserRFMP[i][13] == "衝刺型") {
                Sprint[0] = Sprint[0] + UserRFMP[i][15]; // 加總 衝刺型 學習者F%的百分比
                Sprint[1] = Sprint[1] + UserRFMP[i][16]; // 加總 衝刺型 學習者M%的百分比
                Sprint[2] = Sprint[2] + UserRFMP[i][17]; // 加總 衝刺型 學習者P%的百分比
                Peoplenumber[2] = Peoplenumber[2] + 1; // 加總 衝刺型 人數
            } else if (UserRFMP[i][13] == "扶持型") {
                Supportive[0] = Supportive[0] + UserRFMP[i][15]; // 加總 扶持型 學習者F%的百分比
                Supportive[1] = Supportive[1] + UserRFMP[i][16]; // 加總 扶持型 學習者M%的百分比
                Supportive[2] = Supportive[2] + UserRFMP[i][17]; // 加總 扶持型 學習者P%的百分比
                Peoplenumber[3] = Peoplenumber[3] + 1; // 加總 扶持型 人數
            } else if (UserRFMP[i][13] == "關懷型") {
                Caring[0] = Caring[0] + UserRFMP[i][15]; // 加總 關懷型 學習者F%的百分比
                Caring[1] = Caring[1] + UserRFMP[i][16]; // 加總 關懷型 學習者M%的百分比
                Caring[2] = Caring[2] + UserRFMP[i][17]; // 加總 關懷型 學習者P%的百分比
                Peoplenumber[4] = Peoplenumber[4] + 1; // 加總 關懷型 人數
            } else {
                Peoplenumber[5] = Peoplenumber[5] + 1; // 加總 不在區間內 人數
            }
        }


        // console.log("現在權重值:[",j,"]:",GWO[j]);
        // console.log("各群人數:",Peoplenumber);

        for (let i = 0; i < 3; i++) {
            // 持續型
            if (Peoplenumber[0] != 0) {
                protracted[i] = protracted[i] / Peoplenumber[0];
                protracted[i] = Math.round(protracted[i] * 100) / 100; // 取四捨五入
            }
            // 潛力型
            if (Peoplenumber[1] != 0) {
                potential[i] = potential[i] / Peoplenumber[1];
                potential[i] = Math.round(potential[i] * 100) / 100; // 取四捨五入
            }
            // 衝刺型
            if (Peoplenumber[2] != 0) {
                Sprint[i] = Sprint[i] / Peoplenumber[2];
                Sprint[i] = Math.round(Sprint[i] * 100) / 100; // 取四捨五入
            }
            // 扶持型
            if (Peoplenumber[3] != 0) {
                Supportive[i] = Supportive[i] / Peoplenumber[3];
                Supportive[i] = Math.round(Supportive[i] * 100) / 100; // 取四捨五入
            }
            // 關懷型
            if (Peoplenumber[4] != 0) {
                Caring[i] = Caring[i] / Peoplenumber[4];
                Caring[i] = Math.round(Caring[i] * 100) / 100; // 取四捨五入
            }
        }
        GWO[j][5] = protracted; // GWO[j][5] 紀錄 持續型 群心
        GWO[j][6] = potential; // GWO[j][6] 紀錄 潛力型 群心
        GWO[j][7] = Sprint; // GWO[j][7] 紀錄 衝刺型 群心
        GWO[j][8] = Supportive; // GWO[j][8] 紀錄 扶持型 群心
        GWO[j][9] = Caring; // GWO[j][9] 紀錄 關懷型 群心

        // console.log("-------------------------------計算完群心之後-------------------------------");
        // console.log("現在權重值:[",j,"]:",GWO[j]);
        // console.log("各群人數:",Peoplenumber);
        // console.log("持續型:",protracted);
        // console.log("潛力型",potential);
        // console.log("衝刺型",Sprint);
        // console.log("扶持型",Supportive);
        // console.log("關懷型",Caring);

        // 結束計算每群的群心

        // 計算每個點到群心的距離
        for (let i = 0; i < UserRFMP.length; i++) {
            if (UserRFMP[i][13] == "持續型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - protracted[0], 2) + Math.pow(UserRFMP[i][16] - protracted[1], 2) + Math.pow(UserRFMP[i][17] - protracted[2], 2));
            } else if (UserRFMP[i][13] == "潛力型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - potential[0], 2) + Math.pow(UserRFMP[i][16] - potential[1], 2) + Math.pow(UserRFMP[i][17] - potential[2], 2));
            } else if (UserRFMP[i][13] == "衝刺型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Sprint[0], 2) + Math.pow(UserRFMP[i][16] - Sprint[1], 2) + Math.pow(UserRFMP[i][17] - Sprint[2], 2));
            } else if (UserRFMP[i][13] == "扶持型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Supportive[0], 2) + Math.pow(UserRFMP[i][16] - Supportive[1], 2) + Math.pow(UserRFMP[i][17] - Supportive[2], 2));
            } else if (UserRFMP[i][13] == "關懷型") {
                intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Caring[0], 2) + Math.pow(UserRFMP[i][16] - Caring[1], 2) + Math.pow(UserRFMP[i][17] - Caring[2], 2));
            }

            // 找到群內每一點到群心之間的距離取最大
            if (intradis > Maxintradis) {
                Maxintradis = intradis;
            }

        } // 結束 計算每個點到群心的距離


        // [持續型,潛力型,衝刺型,扶持型,關懷型]
        // [   0  ,  1  ,   2  ,  3  ,   4  ]


        // 計算群間的距離，該群人數不等於0才能做群間計算
        // 持續型 － 潛力型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[1] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - potential[0], 2) + Math.pow(protracted[1] - potential[1], 2) + Math.pow(protracted[2] - potential[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis // 找到每群群心之間的距離取最小
            }
        }
        // 持續型 － 衝刺型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Sprint[0], 2) + Math.pow(protracted[1] - Sprint[1], 2) + Math.pow(protracted[2] - Sprint[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 持續型 － 扶持型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Supportive[0], 2) + Math.pow(protracted[1] - Supportive[1], 2) + Math.pow(protracted[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 持續型 － 關懷型 距離
        if (Peoplenumber[0] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(protracted[0] - Caring[0], 2) + Math.pow(protracted[1] - Caring[1], 2) + Math.pow(protracted[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 衝刺型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[2] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Sprint[0], 2) + Math.pow(potential[1] - Sprint[1], 2) + Math.pow(potential[2] - Sprint[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 扶持型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Supportive[0], 2) + Math.pow(potential[1] - Supportive[1], 2) + Math.pow(potential[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 潛力型 － 關懷型 距離
        if (Peoplenumber[1] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(potential[0] - Caring[0], 2) + Math.pow(potential[1] - Caring[1], 2) + Math.pow(potential[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 衝刺型 － 扶持型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[3] != 0) {
            interdis = Math.sqrt(Math.pow(Sprint[0] - Supportive[0], 2) + Math.pow(Sprint[1] - Supportive[1], 2) + Math.pow(Sprint[2] - Supportive[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 衝刺型 － 關懷型 距離
        if (Peoplenumber[2] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Sprint[0] - Caring[0], 2) + Math.pow(Sprint[1] - Caring[1], 2) + Math.pow(Sprint[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }
        // 扶持型 － 關懷型 距離
        if (Peoplenumber[3] != 0 && Peoplenumber[4] != 0) {
            interdis = Math.sqrt(Math.pow(Supportive[0] - Caring[0], 2) + Math.pow(Supportive[1] - Caring[1], 2) + Math.pow(Supportive[2] - Caring[2], 2));
            if (Mininterdis == 0) {
                Mininterdis = interdis;
            } else if (interdis < Mininterdis) {
                Mininterdis = interdis
            }
        }

        // 紀錄群數
        for (let q = 0; q < Peoplenumber.length - 1; q++) {
            if (Peoplenumber[q] != 0) {
                GroupNum = GroupNum + 1;
            }
        }
        GWO[j][10] = GroupNum;
        GWO[j][11] = Peoplenumber[0];
        GWO[j][12] = Peoplenumber[1];
        GWO[j][13] = Peoplenumber[2];
        GWO[j][14] = Peoplenumber[3];
        GWO[j][15] = Peoplenumber[4];
        GWO[j][16] = Peoplenumber[5];


        // Dunn = Mininterdis / Maxintradis * ( (GroupNum) / 5);   // Dunn 適存值計算 * 懲罰函式 (所分的群數 / 總群數)
        Dunn = Mininterdis / Maxintradis; // Dunn 適存值計算
        GWO[j][4] = Math.round(Dunn * 1000000) / 1000000; // GWO[j][4] 存 Dunn適存值 四捨五入



        // console.log("Maxintradis:",Maxintradis);    // 群內最大
        // console.log("Mininterdis:",Mininterdis);  // 群間最小
        // console.log("Maxintradis:",Math.round(Maxintradis*100)/100);    // 群內最大
        // console.log("Mininterdis:",Math.round(Mininterdis*100)/100);  // 群間最小
        // console.log("GroupNum:",GroupNum);
        // console.log("fitness:",Dunn);
        // console.log("現在權重值:[",j,"]:",GWO[j]);

    } // 結束適存值計算


    // 進行適存值的排序，找出 alpha(α)、Beta(β)、Delta(δ)
    var GWOtime = GWOSize;
    while (GWOtime > 1) {
        GWOtime--;
        for (let i = 0; i < GWOSize - 1; i++) {
            var temp;
            if (GWO[i][4] < GWO[i + 1][4]) {
                temp = GWO[i];
                GWO[i] = GWO[i + 1];
                GWO[i + 1] = temp;
            }
        }
    }


    GWOalpha = [];
    GWObeta = [];
    GWOdelta = [];
    for (let q = 0; q < GWO[0].length; q++) {
        GWOalpha.push(GWO[0][q]);
    }
    for (let q = 0; q < GWO[1].length; q++) {
        GWObeta.push(GWO[1][q]);
    }
    for (let q = 0; q < GWO[2].length; q++) {
        GWOdelta.push(GWO[2][q]);
    }

} // 結束 DunnIndexFMP 的副程式

// 原始FMP權重 (50,50,50)
function DunnIndexTestFMP() {
    // 計算適存值
    GroupNum = 0;
    // 計算 RFMP值 以及 學習者類型判斷
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][14] >= BestGWO[0]) { UserRFMP[i][9] = 1; } // UserRFMP[index][14] 存 R%，GWO[j][0] 存 random R %，UserRFMP[i][9] 判斷 0/1 (L/H)
        else { UserRFMP[i][9] = 0; }
        if (UserRFMP[i][15] >= BestGWO[1]) { UserRFMP[i][10] = 1; } // UserRFMP[index][15] 存 F%，GWO[j][1] 存 random F %，UserRFMP[i][10] 判斷 0/1 (L/H)
        else { UserRFMP[i][10] = 0; }
        if (UserRFMP[i][16] >= BestGWO[2]) { UserRFMP[i][11] = 1; } // UserRFMP[index][16] 存 M%，GWO[j][2] 存 random M %，UserRFMP[i][11] 判斷 0/1 (L/H)
        else { UserRFMP[i][11] = 0; }
        if (UserRFMP[i][17] >= BestGWO[3]) { UserRFMP[i][12] = 1; } // UserRFMP[index][17] 存 P%，GWO[j][3] 存 random P %，UserRFMP[i][12] 判斷 0/1 (L/H)
        else { UserRFMP[i][12] = 0; }

        if (UserRFMP[i][5] == -1) { UserRFMP[i][9] = -1; } // UserRFMP[index][9] 存 R值
        if (UserRFMP[i][6] == -1) { UserRFMP[i][10] = -1; } // UserRFMP[index][10] 存 F值
        if (UserRFMP[i][7] == -1) { UserRFMP[i][11] = -1; } // UserRFMP[index][11] 存 M值
        if (UserRFMP[i][8] == -1) { UserRFMP[i][12] = -1; } // UserRFMP[index][12] 存 P值

        // 以下  FMP模型
        if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "關懷型";
            TypeNumber[0] = TypeNumber[0] + 1;
        } // 1
        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "潛力型";
            TypeNumber[1] = TypeNumber[1] + 1;
        } // 2
        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[2] = TypeNumber[2] + 1;
        } // 3
        else if (UserRFMP[i][10] == 0 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "衝刺型";
            TypeNumber[3] = TypeNumber[3] + 1;
        } // 4
        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[4] = TypeNumber[4] + 1;
        } // 5
        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 0 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "持續型";
            TypeNumber[5] = TypeNumber[5] + 1;
        } // 6
        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 0) {
            UserRFMP[i][13] = "扶持型";
            TypeNumber[6] = TypeNumber[6] + 1;
        } // 7
        else if (UserRFMP[i][10] == 1 && UserRFMP[i][11] == 1 && UserRFMP[i][12] == 1) {
            UserRFMP[i][13] = "持續型";
            TypeNumber[7] = TypeNumber[7] + 1;
        } // 8
        else if (UserRFMP[i][9] == -1 && UserRFMP[i][10] == -1 && UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "不在區間"; } // 不在所選區間內
        else if (UserRFMP[i][11] == -1 && UserRFMP[i][12] == -1) { UserRFMP[i][13] = "無闖關者"; }
        // 以上  FMP模型

        // 檢查驗證用的
        // if(UserRFMP[i][0] == "C108110121@nkust.edu.tw"){
        //     console.log(UserRFMP[i]);
        // }
    } // 結束計算 RFMP值 以及 學習者類型判斷

    // DunnIdex開始計算fitness
    // UserRFMP陣列裡中每一筆資料存 [玩家信箱,R數據,F數據,M數據,P數據,R評分,F評分,M評分,P評分,R值,F值,M值,P值,學習者類型,R%,F%,M%,P%]
    //                             [   0   ,  1  ,  2  ,  3  , 4  ,  5  ,  6  , 7   ,  8  , 9 , 10,11, 12,    13   ,14,15,16,17]
    // 灰狼演算法陣列裡存 [權重值R,權重值F,權重值M,權重值P,fitness,持續型群心,潛力型群心,衝刺型群心,扶持型群心,衝刺型群心]
    //                  [   0  ,   1   ,   2  ,   3   ,   4   ,    5    ,     6    ,    7    ,    8   ,    9    ]
    interdis = 0; // 記錄群間距離
    intradis = 0; // 紀錄到群心距離
    Mininterdis = 0; // 計算每群群心之間的距離取最小
    Maxintradis = 0; // 計算每群內每一點到群心之間的距離取最大
    // 因為要達成 群間距離最大 & 群內距離最小 的分群條件，才算是最好的分群
    Dunn = 0; // 最終的適存值計算

    protracted = [0, 0, 0]; // 持續型
    potential = [0, 0, 0]; // 潛力型
    Sprint = [0, 0, 0]; // 衝刺型
    Supportive = [0, 0, 0]; // 扶持型
    Caring = [0, 0, 0]; // 關懷型
    Peoplenumber = [0, 0, 0, 0, 0, 0]; // [持續型,潛力型,衝刺型,扶持型,關懷型,不在區間內]
    //  紀錄每群人數                  [   0  ,  1  ,   2  ,  3  ,   4 ,    5    ]

    // 計算每群的群心
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][13] == "持續型") {
            protracted[0] = protracted[0] + UserRFMP[i][15]; // 加總 持續型 學習者F%的百分比
            protracted[1] = protracted[1] + UserRFMP[i][16]; // 加總 持續型 學習者M%的百分比
            protracted[2] = protracted[2] + UserRFMP[i][17]; // 加總 持續型 學習者P%的百分比
            Peoplenumber[0] = Peoplenumber[0] + 1; // 加總 持續型 人數
        } else if (UserRFMP[i][13] == "潛力型") {
            potential[0] = potential[0] + UserRFMP[i][15]; // 加總 潛力型 學習者F%的百分比
            potential[1] = potential[1] + UserRFMP[i][16]; // 加總 潛力型 學習者M%的百分比
            potential[2] = potential[2] + UserRFMP[i][17] // 加總 潛力型 學習者P%的百分比
            Peoplenumber[1] = Peoplenumber[1] + 1; // 加總 潛力型 人數
        } else if (UserRFMP[i][13] == "衝刺型") {
            Sprint[0] = Sprint[0] + UserRFMP[i][15]; // 加總 衝刺型 學習者F%的百分比
            Sprint[1] = Sprint[1] + UserRFMP[i][16]; // 加總 衝刺型 學習者M%的百分比
            Sprint[2] = Sprint[2] + UserRFMP[i][17]; // 加總 衝刺型 學習者P%的百分比
            Peoplenumber[2] = Peoplenumber[2] + 1; // 加總 衝刺型 人數
        } else if (UserRFMP[i][13] == "扶持型") {
            Supportive[0] = Supportive[0] + UserRFMP[i][15]; // 加總 扶持型 學習者F%的百分比
            Supportive[1] = Supportive[1] + UserRFMP[i][16]; // 加總 扶持型 學習者M%的百分比
            Supportive[2] = Supportive[2] + UserRFMP[i][17]; // 加總 扶持型 學習者P%的百分比
            Peoplenumber[3] = Peoplenumber[3] + 1; // 加總 扶持型 人數
        } else if (UserRFMP[i][13] == "關懷型") {
            Caring[0] = Caring[0] + UserRFMP[i][15]; // 加總 關懷型 學習者F%的百分比
            Caring[1] = Caring[1] + UserRFMP[i][16]; // 加總 關懷型 學習者M%的百分比
            Caring[2] = Caring[2] + UserRFMP[i][17]; // 加總 關懷型 學習者P%的百分比
            Peoplenumber[4] = Peoplenumber[4] + 1; // 加總 關懷型 人數
        } else {
            Peoplenumber[5] = Peoplenumber[5] + 1; // 加總 不在區間內 人數
        }
    }


    // console.log("現在權重值:[",j,"]:",GWO[j]);
    // console.log("各群人數:",Peoplenumber);

    for (let i = 0; i < 3; i++) {
        // 持續型
        if (Peoplenumber[0] != 0) {
            protracted[i] = protracted[i] / Peoplenumber[0];
            protracted[i] = Math.round(protracted[i] * 100) / 100; // 取四捨五入
        }
        // 潛力型
        if (Peoplenumber[1] != 0) {
            potential[i] = potential[i] / Peoplenumber[1];
            potential[i] = Math.round(potential[i] * 100) / 100; // 取四捨五入
        }
        // 衝刺型
        if (Peoplenumber[2] != 0) {
            Sprint[i] = Sprint[i] / Peoplenumber[2];
            Sprint[i] = Math.round(Sprint[i] * 100) / 100; // 取四捨五入
        }
        // 扶持型
        if (Peoplenumber[3] != 0) {
            Supportive[i] = Supportive[i] / Peoplenumber[3];
            Supportive[i] = Math.round(Supportive[i] * 100) / 100; // 取四捨五入
        }
        // 關懷型
        if (Peoplenumber[4] != 0) {
            Caring[i] = Caring[i] / Peoplenumber[4];
            Caring[i] = Math.round(Caring[i] * 100) / 100; // 取四捨五入
        }
    }
    BestGWO[5] = protracted; // GWO[j][5] 紀錄 持續型 群心
    BestGWO[6] = potential; // GWO[j][6] 紀錄 潛力型 群心
    BestGWO[7] = Sprint; // GWO[j][7] 紀錄 衝刺型 群心
    BestGWO[8] = Supportive; // GWO[j][8] 紀錄 扶持型 群心
    BestGWO[9] = Caring; // GWO[j][9] 紀錄 關懷型 群心

    // console.log("-------------------------------計算完群心之後-------------------------------");
    // console.log("現在權重值:[",j,"]:",GWO[j]);
    // console.log("各群人數:",Peoplenumber);
    // console.log("持續型:",protracted);
    // console.log("潛力型",potential);
    // console.log("衝刺型",Sprint);
    // console.log("扶持型",Supportive);
    // console.log("關懷型",Caring);

    // 結束計算每群的群心

    // 計算每個點到群心的距離
    for (let i = 0; i < UserRFMP.length; i++) {
        if (UserRFMP[i][13] == "持續型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - protracted[0], 2) + Math.pow(UserRFMP[i][16] - protracted[1], 2) + Math.pow(UserRFMP[i][17] - protracted[2], 2));
        } else if (UserRFMP[i][13] == "潛力型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - potential[0], 2) + Math.pow(UserRFMP[i][16] - potential[1], 2) + Math.pow(UserRFMP[i][17] - potential[2], 2));
        } else if (UserRFMP[i][13] == "衝刺型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Sprint[0], 2) + Math.pow(UserRFMP[i][16] - Sprint[1], 2) + Math.pow(UserRFMP[i][17] - Sprint[2], 2));
        } else if (UserRFMP[i][13] == "扶持型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Supportive[0], 2) + Math.pow(UserRFMP[i][16] - Supportive[1], 2) + Math.pow(UserRFMP[i][17] - Supportive[2], 2));
        } else if (UserRFMP[i][13] == "關懷型") {
            intradis = Math.sqrt(Math.pow(UserRFMP[i][15] - Caring[0], 2) + Math.pow(UserRFMP[i][16] - Caring[1], 2) + Math.pow(UserRFMP[i][17] - Caring[2], 2));
        }

        // 找到群內每一點到群心之間的距離取最大
        if (intradis > Maxintradis) {
            Maxintradis = intradis;
        }

    } // 結束 計算每個點到群心的距離


    // [持續型,潛力型,衝刺型,扶持型,關懷型]
    // [   0  ,  1  ,   2  ,  3  ,   4  ]


    // 計算群間的距離，該群人數不等於0才能做群間計算
    // 持續型 － 潛力型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[1] != 0) {
        interdis = Math.sqrt(Math.pow(protracted[0] - potential[0], 2) + Math.pow(protracted[1] - potential[1], 2) + Math.pow(protracted[2] - potential[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis // 找到每群群心之間的距離取最小
        }
    }
    // 持續型 － 衝刺型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[2] != 0) {
        interdis = Math.sqrt(Math.pow(protracted[0] - Sprint[0], 2) + Math.pow(protracted[1] - Sprint[1], 2) + Math.pow(protracted[2] - Sprint[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 持續型 － 扶持型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(protracted[0] - Supportive[0], 2) + Math.pow(protracted[1] - Supportive[1], 2) + Math.pow(protracted[2] - Supportive[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 持續型 － 關懷型 距離
    if (Peoplenumber[0] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(protracted[0] - Caring[0], 2) + Math.pow(protracted[1] - Caring[1], 2) + Math.pow(protracted[2] - Caring[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 潛力型 － 衝刺型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[2] != 0) {
        interdis = Math.sqrt(Math.pow(potential[0] - Sprint[0], 2) + Math.pow(potential[1] - Sprint[1], 2) + Math.pow(potential[2] - Sprint[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 潛力型 － 扶持型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(potential[0] - Supportive[0], 2) + Math.pow(potential[1] - Supportive[1], 2) + Math.pow(potential[2] - Supportive[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 潛力型 － 關懷型 距離
    if (Peoplenumber[1] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(potential[0] - Caring[0], 2) + Math.pow(potential[1] - Caring[1], 2) + Math.pow(potential[2] - Caring[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 衝刺型 － 扶持型 距離
    if (Peoplenumber[2] != 0 && Peoplenumber[3] != 0) {
        interdis = Math.sqrt(Math.pow(Sprint[0] - Supportive[0], 2) + Math.pow(Sprint[1] - Supportive[1], 2) + Math.pow(Sprint[2] - Supportive[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 衝刺型 － 關懷型 距離
    if (Peoplenumber[2] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(Sprint[0] - Caring[0], 2) + Math.pow(Sprint[1] - Caring[1], 2) + Math.pow(Sprint[2] - Caring[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }
    // 扶持型 － 關懷型 距離
    if (Peoplenumber[3] != 0 && Peoplenumber[4] != 0) {
        interdis = Math.sqrt(Math.pow(Supportive[0] - Caring[0], 2) + Math.pow(Supportive[1] - Caring[1], 2) + Math.pow(Supportive[2] - Caring[2], 2));
        if (Mininterdis == 0) {
            Mininterdis = interdis;
        } else if (interdis < Mininterdis) {
            Mininterdis = interdis
        }
    }

    // 紀錄群數
    for (let q = 0; q < Peoplenumber.length - 1; q++) {
        if (Peoplenumber[q] != 0) {
            GroupNum = GroupNum + 1;
        }
    }
    BestGWO[10] = GroupNum;
    BestGWO[11] = Peoplenumber[0];
    BestGWO[12] = Peoplenumber[1];
    BestGWO[13] = Peoplenumber[2];
    BestGWO[14] = Peoplenumber[3];
    BestGWO[15] = Peoplenumber[4];
    BestGWO[16] = Peoplenumber[5];


    // Dunn = Mininterdis / Maxintradis * (GroupNum / 5);   // Dunn 適存值計算 * 懲罰函式 (所分的群數 / 總群數)
    Dunn = Mininterdis / Maxintradis; // Dunn 適存值計算
    BestGWO[4] = Math.round(Dunn * 1000000) / 1000000; // GWO[j][4] 存 Dunn適存值 四捨五入

    // 結束適存值計算

} // 結束 DunnIndexTestFMP 的副程式
// 以上宜靜 2020.05.18

router.get('/management', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    if (!req.user.isadmin) { //如有其他管理者 在這加
        return res.redirect('/login')
    }
    res.render('backstage/management', {
        user: req.user.username
    });
});
router.post('/management', function(req, res, next) {
    // Parse Info

    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "loadmusicData") {
        if (req.session.bkMusicVolumn && req.session.musicLevel && req.session.bkMusicSwitch) {
            req.session.bkMusicVolumn = arseInt(req.body.bkMusicVolumn);
            req.session.bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
            req.session.musicLevel = parseInt(req.body.musicLevel);
            console.log("tstt success");
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(JSON.stringify(scriptData));
        } else {
            console.log("tstt nome");
            scriptData = {
                bkMusicVolumn: 0.1,
                bkMusicSwitch: 1,
                musicLevel: 1
            }
            req.session.bkMusicVolumn = 0.1;
            req.session.bkMusicSwitch = 1;
            req.session.musicLevel = 1;
            res.json(scriptData);

        }

    }

});

router.get('/managementStatistics', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)
    if (req.user.isadmin == false) { //如有其他管理者 在這加
        res.redirect('/login')
    }
    res.render('backstage/managementStatistics', {
        user: req.user.username
    });
});
router.post('/managementStatistics', function(req, res, next) {
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "loadmusicData") {
        if (req.session.bkMusicVolumn && req.session.musicLevel && req.session.bkMusicSwitch) {
            req.session.bkMusicVolumn = arseInt(req.body.bkMusicVolumn);
            req.session.bkMusicSwitch = parseInt(req.body.bkMusicSwitch);
            req.session.musicLevel = parseInt(req.body.musicLevel);
            console.log("tstt success");
            scriptData = {
                bkMusicVolumn: req.session.bkMusicVolumn,
                bkMusicSwitch: req.session.bkMusicSwitch,
                musicLevel: req.session.musicLevel
            }
            res.json(JSON.stringify(scriptData));
        } else {
            console.log("tstt nome");
            scriptData = {
                bkMusicVolumn: 0.1,
                bkMusicSwitch: 1,
                musicLevel: 1
            }
            req.session.bkMusicVolumn = 0.1;
            req.session.bkMusicSwitch = 1;
            req.session.musicLevel = 1;
            res.json(scriptData);

        }

    } else if (type == "readAllPlay") {
        User.getUser(req.user.id, function(err, users) {
            if (err) throw err;
            res.json(users);
        })
    } else {

    }

});

router.get('/', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user)

    User.getUserById(req.user.id, function(err, user) {

        if (err) throw err;
        if (user.isadmin == false) { //如有其他管理者 在這加
            res.redirect('/home')
        }

        /*初次一定要做 預設檔案進db*/
        // var dictJson = testDict.dict.code;
        // for (let index = 0; index < dictJson.length; index++) {
        //     console.log(dictJson[index].type, dictJson[index].element);
        //     var newDictionary = new DictionaryRecord({
        //         type:dictJson[index].type,
        //         element:dictJson[index].element
        //     })
        //     DictionaryRecord.createDictionary(newDictionary, function (err, dict) {

        //         console.log(dict);
        //     })
        // }
        // var equipJson = testEquip;
        // var newEquipment = new EquipmentRecord({
        //     levelUpLevel: equipJson.levelUpLevel,
        //     weaponLevel:equipJson.weaponLevel,
        //     armorLevel: equipJson.armorLevel
        // })
        // EquipmentRecord.createEquipment(newEquipment, function (err, dict) {
        //     console.log(dict);
        // })

        var openLokCastle = false;
        var codeLevel = -1;
        for (let index = 0; index < user.EasyEmpire.codeLevel.length; index++) {
            const element = user.EasyEmpire.codeLevel[index];
            if (parseInt(element.level) > codeLevel && element.HighestStarNum > 0) {
                codeLevel = parseInt(element.level);
                if (parseInt(element.level) >= 23) {
                    openLokCastle = true;
                    break;
                } else {
                    // console.log(codeLevel, parseInt(element.level));
                }
            }
        }
        var blockLevel = -1;
        for (let index = 0; index < user.EasyEmpire.blockLevel.length; index++) {
            const element = user.EasyEmpire.blockLevel[index];
            if (parseInt(element.level) > blockLevel && element.HighestStarNum > 0) {
                blockLevel = parseInt(element.level);
                if (parseInt(element.level) >= 23) {
                    openLokCastle = true;
                    break;
                } else {
                    // console.log(blockLevel, parseInt(element.level));
                }
            }
        }
        var codeLevel = user.EasyEmpire.codeLevel.length;
        var blockLevel = user.EasyEmpire.blockLevel.length;
        var totalLevel = Math.max(codeLevel, blockLevel);
        var lock = "unCastle_code";
        if (openLokCastle) {
            lock = "castle_code";
        }


        res.render('home/homeByManage', {
            user: req.user.username,
            castlelock: lock,
        });
    })
});
router.post('/', function(req, res, next) {
    console.log(req.body);
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "loadmusicData") {
        /*if(req.session.bkMusicVolumn && req.session.musicLevel && req.session.bkMusicSwitch){
          req.session.bkMusicVolumn=arseInt(req.body.bkMusicVolumn);
          req.session.bkMusicSwitch=parseInt(req.body.bkMusicSwitch);
          req.session.musicLevel=parseInt(req.body.musicLevel);
          console.log("tstt success");
          scriptData={
            bkMusicVolumn: req.session.bkMusicVolumn
            ,bkMusicSwitch: req.session.bkMusicSwitch
            ,musicLevel: req.session.musicLevel
          }
          res.json(JSON.stringify(scriptData));
        }
        else{
          console.log("tstt nome");
          scriptData={
            bkMusicVolumn: 0.1
            ,bkMusicSwitch: 1
            ,musicLevel: 1
          }
          req.session.bkMusicVolumn=0.1;
          req.session.bkMusicSwitch=1;
          req.session.musicLevel=1;
          res.json(JSON.stringify(scriptData));

        }*/

    }

    /**更新部分 */
    else if (type == "resetEquip") {
        var id = req.user.id;
        User.updateResetEquip(id, function(err, user) {
            if (err) throw err;
            console.log("up   :", user);
            User.getUserById(id, function(err, user) {
                if (err) throw err;
                res.json(user);
            })
        })
    } else if (type == "userMap") {
        MapRecord.getMapByUserID(req.user.id, function(err, map) {
            if (err) throw err;
            var dataMap = [];
            for (let indexM = 0; indexM < map.length; indexM++) {
                const element = map[indexM];
                if (element.check == true && element.postStage == 2) {
                    dataMap.push(element);
                }

            }
            res.json(dataMap);
            // console.log(req.user.id);
            // console.log(map);
            // res.json(map);
        })
    }
    /********* */
    else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----暫時的 ------
    else if (type == "changePassword") {
        var id = req.user.id
        var password = req.body.password
        var oldPassword = req.body.oldPassword
            // console.log(password,oldPassword);

        User.getUserById(id, function(err, user) {
                if (err) throw err;
                if (user) {
                    // console.log(user);
                    User.comparePassword(oldPassword, user.password, function(err, isMatch) {
                        if (err) throw err
                        if (isMatch) {
                            req.flash('success_msg', 'you are updatePass now')
                            User.updatePassword(user.username, password, function(err, user) {
                                if (err) throw err;
                                // console.log("update :", user);
                            })
                            req.session.updatePassKey = null;
                            return res.json({ responce: 'sucesss' });
                        } else {
                            return res.json({ responce: 'failPassUndifine' });
                        }
                    })
                } else {
                    return res.json({ responce: 'error' });
                }
            })
            // res.redirect('/login')
    } else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);

        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else if (type == "updateDict") {
        var dictType = req.body.dictType
        var dictNum = req.body.dictNum
        var dictValue = req.body.dictValue
        console.log(dictType, dictNum, dictValue);
        DictionaryRecord.getDictionary(function(err, dict) {
            if (err) throw err;
            var typeIndex = 0;
            for (let index = 0; index < dict.length; index++) {
                var element = dict[index];
                if (element.type == dictType) {
                    element.element[dictNum].value = dictValue;
                    typeIndex = index;
                    break;
                    // console.log(element);

                }
            }
            DictionaryRecord.updateDictionaryByType(dict[typeIndex].type, dict[typeIndex].element, function(err, dictResult) {
                if (err) throw err;
                res.json({ res: true });
            });
        });
    }
    //-------------------
    else {

    }

});

router.get('/home', ensureAuthenticated, function(req, res, next) {
    // console.log(req.user);

    User.getUserById(req.user.id, function(err, user) {
        if (err) throw err;
        if (user.isadmin) {
            return res.redirect('/management');
        }
        var openLokCastle = false;
        var codeLevel = -1;
        for (let index = 0; index < user.EasyEmpire.codeLevel.length; index++) {
            const element = user.EasyEmpire.codeLevel[index];
            if (parseInt(element.level) > codeLevel && element.HighestStarNum > 0) {
                codeLevel = parseInt(element.level);
                if (parseInt(element.level) >= 23) {
                    openLokCastle = true;
                    break;
                } else {
                    console.log(codeLevel, parseInt(element.level));
                }
            }
        }
        var blockLevel = -1;
        for (let index = 0; index < user.EasyEmpire.blockLevel.length; index++) {
            const element = user.EasyEmpire.blockLevel[index];
            if (parseInt(element.level) > blockLevel && element.HighestStarNum > 0) {
                blockLevel = parseInt(element.level);
                if (parseInt(element.level) >= 23) {
                    openLokCastle = true;
                    break;
                } else {
                    console.log(blockLevel, parseInt(element.level));
                }
            }
        }
        var codeLevel = user.EasyEmpire.codeLevel.length;
        var blockLevel = user.EasyEmpire.blockLevel.length;
        var totalLevel = Math.max(codeLevel, blockLevel);
        var lock = "unCastle_code";
        if (openLokCastle) {
            lock = "castle_code";
        }
        console.log(JSON.stringify(req.user).toString());
        // DictionaryRecord.getDictionary(function (err, dict) {
        //     EquipmentRecord.getEquipment(function (err, equip) {
        //         return res.render('home/home', {
        //             user: req.user.username,
        //             castlelock: lock,
        //             player:JSON.stringify(req.user).toString(),
        //             gameDict:JSON.stringify(dict).toString(),
        //             gameEquip:JSON.stringify(equip[0]).toString()
        //         });
        //     });
        // });
        return res.render('home/home', {
            user: req.user.username,
            castlelock: lock
        });
    })
});
router.post('/home', function(req, res, next) {
    console.log(req.body);
    // Parse Info
    var type = req.body.type
    console.log("home post--------");
    console.log(req.body.type);
    console.log("--------------");
    if (type == "init") {
        var id = req.user.id;
        // console.log(req.user.id);
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            res.json(user);
        })
    } else if (type == "loadmusicData") {
        /*if(req.session.bkMusicVolumn && req.session.musicLevel && req.session.bkMusicSwitch){
          req.session.bkMusicVolumn=arseInt(req.body.bkMusicVolumn);
          req.session.bkMusicSwitch=parseInt(req.body.bkMusicSwitch);
          req.session.musicLevel=parseInt(req.body.musicLevel);
          console.log("tstt success");
          scriptData={
            bkMusicVolumn: req.session.bkMusicVolumn
            ,bkMusicSwitch: req.session.bkMusicSwitch
            ,musicLevel: req.session.musicLevel
          }
          res.json(JSON.stringify(scriptData));
        }
        else{
          console.log("tstt nome");
          scriptData={
            bkMusicVolumn: 0.1
            ,bkMusicSwitch: 1
            ,musicLevel: 1
          }
          req.session.bkMusicVolumn=0.1;
          req.session.bkMusicSwitch=1;
          req.session.musicLevel=1;
          res.json(JSON.stringify(scriptData));

        }*/

    }

    /**更新部分 */
    else if (type == "resetEquip") {
        var id = req.user.id;
        User.updateResetEquip(id, function(err, user) {
            if (err) throw err;
            console.log("up   :", user);
            User.getUserById(id, function(err, user) {
                if (err) throw err;
                res.json(user);
            })
        })
    } else if (type == "userMap") {
        MapRecord.getMapByUserID(req.user.id, function(err, map) {
            if (err) throw err;
            var dataMap = [];
            for (let indexM = 0; indexM < map.length; indexM++) {
                const element = map[indexM];
                if (element.check == true && element.postStage == 2) {
                    dataMap.push(element);
                }

            }
            res.json(dataMap);
            // console.log(req.user.id);
            // console.log(map);
            // res.json(map);
        })
    }
    /********* */
    else if (type == "weaponLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var weaponLevel = parseInt(user.weaponLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateWeaponLevel(id, weaponLevel, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    } else if (type == "armorLevelup") {
        var id = req.user.id;
        User.getUserById(id, function(err, user) {
            if (err) throw err;
            var armorLevelup = parseInt(user.armorLevel) + 1
            var levelUpLevel = parseInt(user.levelUpLevel)
                // if (Equipment.levelUpLevel[levelUpLevel].star > user.starNum) {
                //     res.json({ err: "error" });
                // }
                // else {
            levelUpLevel += 1;
            User.updateArmorLevel(id, armorLevelup, levelUpLevel, function(err, user) {
                    if (err) throw err;
                    // console.log("up   :", user);
                    User.getUserById(id, function(err, user) {
                        if (err) throw err;
                        res.json(user);
                    })
                })
                // }
        })
    }
    //-----暫時的 ------
    else if (type == "loadDict") {
        DictionaryRecord.getDictionary(function(err, dict) {
            returnData = dict.sort(function(a, b) {
                return a.level > b.level ? 1 : -1;
            });
            res.json(returnData);

        });
    } else if (type == "loadEquip") {
        EquipmentRecord.getEquipment(function(err, equip) {
            res.json(equip[0]);
        });
    } else if (type == "updateEquip") {
        var seriJson = JSON.parse(req.body.seriJson)
        var armorLevel = seriJson.armorLevel;
        var weaponLevel = seriJson.weaponLevel;
        var levelUpLevel = seriJson.levelUpLevel;
        // console.log(seriJson);
        // console.log(armorLevel,weaponLevel,levelUpLevel);
        EquipmentRecord.updateEquipment(armorLevel, weaponLevel, levelUpLevel, function(err, dictResult) {
            if (err) throw err;
            res.json({ res: true });
        });
    } else if (type == "changePassword") {
        var id = req.user.id
        var password = req.body.password
        var oldPassword = req.body.oldPassword
            // console.log(password,oldPassword);

        User.getUserById(id, function(err, user) {
                if (err) throw err;
                if (user) {
                    // console.log(user);
                    User.comparePassword(oldPassword, user.password, function(err, isMatch) {
                        if (err) throw err
                        if (isMatch) {
                            req.flash('success_msg', 'you are updatePass now')
                            User.updatePassword(user.username, password, function(err, user) {
                                if (err) throw err;
                                // console.log("update :", user);
                            })
                            req.session.updatePassKey = null;
                            return res.json({ responce: 'sucesss' });
                        } else {
                            return res.json({ responce: 'failPassUndifine' });
                        }
                    })
                } else {
                    return res.json({ responce: 'error' });
                }
            })
            // res.redirect('/login')
    }

    //-------------------
    else {

    }

});


router.get('/logout', function(req, res, next) {
    req.logout() //將使用者存在 session 的資料作廢(passport提供的)
    req.flash('success_msg', 'You are logged out')
    res.redirect('/login')
})

router.post('/loadGameMap', function(req, res, next) {
    console.log(req.body);
    console.log("loadGameMap post--------");

    var levelId = req.body.gameLevel;
    console.log(req.body.gameLevel);
    GameMapRecord.getMapByLevel(levelId, function(err, mapData) {
        res.json(mapData);
    });

});
router.post('/updateGameMap', function(req, res, next) {
    console.log(req.body);
    console.log("loadGameMap post--------");

    var levelId = req.body.gameLevel;
    var scriptData = JSON.parse(req.body.data);
    // console.log(scriptData);
    GameMapRecord.updateMapByLevel(levelId, scriptData, function(err, mapData) {
        return res.json(mapData);
    });
});

router.post('/loadGameMapData', function(req, res, next) {
    var start = 0,
        end = 50;
    GameMapRecord.getMap(function(err, mapData) {
        // res.json(mapData);
        if (err)
            console.log(err);

        var returnData = [];
        for (let index = start; index < end; index++) {
            var element = mapData[index];
            // console.log(element.level);

            for (let entry = 0; entry < element.data.length; entry++) {
                var entryItem = element.data[entry];
                // console.log(entryItem);
                if (entryItem.versionID == element.versionID) {
                    returnData.push(
                        entryItem.description
                    );
                    break;
                }
            }
        }

        returnData = returnData.sort(function(a, b) {
            return a.level > b.level ? 1 : -1;
        });
        res.json(returnData);
    })

});

router.post('/loadThisLevelGameMapData', function(req, res, next) {
    var level = req.body.level
    var gameMode = req.body.gameMode // code or blocky
    console.log(req.body, level, gameMode);
    var start = 0,
        end = 50;
    if (gameMode == "code") {
        var mainDescription = "mainCodeDescription";
    } else {
        var mainDescription = "mainBlockyDescription";
        // end=24;
    }
    GameMapRecord.getMap(function(err, mapData) {
        // res.json(mapData);
        if (err)
            console.log(err);
        var returnData = [];
        for (let index = start; index < end; index++) {
            var element = mapData[index];
            if (gameMode == "blocky" && element.level >= 24) {
                continue;
            }
            if (element.level != level) {
                returnData.push({
                    level: element.level + 1
                })
                continue;
            }
            for (let entry = 0; entry < element.data.length; entry++) {
                var entryItem = element.data[entry];
                if (entryItem.versionID == element.versionID) {
                    returnData.push(
                        entryItem[mainDescription]
                    );
                    break;
                }
            }
        }


        // console.log('returnData:'+returnData);
        returnData = returnData.sort(function(a, b) {
            return a.level > b.level ? 1 : -1;
        }); //資料照1~50關順序排好(因為資料庫裡原本是亂的)
        res.json(returnData);
    })

});

router.post('/loadThisLevelGameMapMap', function(req, res, next) {
    var level = req.body.level
    console.log(req.body, level);
    var start = 0,
        end = 50;
    GameMapRecord.getMap(function(err, mapData) {
        // res.json(mapData);
        if (err)
            console.log(err);
        for (let index = start; index < end; index++) {
            var element = mapData[index];
            if (element.level != level) {
                continue;
            }
            for (let entry = 0; entry < element.data.length; entry++) {
                var entryItem = element.data[entry];
                // console.log(entryItem);
                if (entryItem.versionID == element.versionID) {
                    return res.json(entryItem.map);
                }
            }
        }
    })

});
router.post('/changeUserCreateMapPermission', function(req, res, next) {
    var userId = req.body.userId
    var canCreateMapPermission = req.body.canCreateMapPermission
    User.updateUserCreateMapPermission(userId, canCreateMapPermission, function(err, users) {
        if (err) throw err;
        res.json(users);
    })

});


module.exports = router;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'you are not logged in')
        res.redirect('/login')
    }
}