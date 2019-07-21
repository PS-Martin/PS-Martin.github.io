
var dobleSalt=0;
var dobleSaltON=0;
var gyro=0;
window.addEventListener("deviceorientation", function(event) {
    let x = event.gamma;
     	gyro = (x/Math.abs(x))
    	
}, true);
//We initialize a game state
PlayState = {};
window.addEventListener("deviceorientation", function(event) {
    let x = event.gamma;
     	gyro = (x/(-x))
    	
}, true);
//Here we initilalize Phaser with an specific aspect ratio, when loading the window.
//we also load the game state initialized before 
window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');

   
		
};



PlayState.init = function () {
    this.game.renderer.renderSession.roundPixels = true; //as we don't want any blurr with pixel art
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        run: Phaser.KeyCode.SHIFT,
        up: Phaser.KeyCode.UP


    });
    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);


    this.coinPickupCount = 0;
    this.hasKey = false;


};

PlayState.update = function () {
	this._handleCollisions();
    this._handleInput();
  //  this._handleOrientation();
    this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = this.hasKey ? 1 : 0;
	
	
  
};

//This is used to preload images: we stablish a key or label 'background' to use the background.png asset
PlayState.preload = function () {
	this.game.load.json ('level:1', 'data/level01.json');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    //this.game.load.image('hero', 'images/hero_stopped.png'); //deleted to use animation
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:music1', 'audio/Base1.wav');
    this.game.load.audio('sfx:musci2', 'audio/Base2.wav');
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.audio('sfx:coin', 'audio/eat.wav');
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.audio('sfx:stomp', 'audio/scream.mp3');
    this.game.load.audio('sfx:ouch', 'audio/ouch.mp3');
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.image('key', 'images/key.png');
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');
    this.game.load.audio('sfx:win', 'audio/win.mp3');
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
};

//This is used to render an image, using the reference (0,0), top left corner, and the key ('background') loaded before.
PlayState.create = function () {
	this.sfx = {
		key: this.game.add.audio('sfx:key'),
        door: this.game.add.audio('sfx:door'),
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp'),
        ouch: this.game.add.audio('sfx:ouch'),
        win: this.game.add.audio('sfx:win'),
        music1: this.game.add.audio('sfx:music1')
    };
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON('level:1'));
    this._createHud();
   
     
};




PlayState._loadLevel = function (data) {
	
	this.bgDecoration = this.game.add.group();
	this.platforms = this.game.add.group();
	this.coins = this.game.add.group();
	this.spiders = this.game.add.group();
	this.enemyWalls = this.game.add.group();
	this.enemyWalls.visible = false;

	//console.log(data) //to delete later
	data.platforms.forEach(this._spawnPlatform, this);
	this._spawnCharacters({hero: data.hero, spiders: data.spiders});
	data.coins.forEach(this._spawnCoin, this);
	this._spawnDoor(data.door.x, data.door.y);
	this._spawnKey(data.key.x, data.key.y);
	const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;

    
};

//UI-HUD
PlayState._createHud = function () {
    
	this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

    //let coinIcon = this.game.make.image(0, 0, 'icon:coin');
    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,
        coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.position.set(10, 10);
    
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
};

//Called to generate the sprites in the specified positions
PlayState._spawnPlatform = function (platform){
	//this.game.add.sprite(platform.x, platform.y, platform.image);
	let sprite = this.platforms.create(platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false; //so that platforms won't fall
    sprite.body.immovable = true;
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};


PlayState._spawnCharacters = function (data) {
    // spawn hero
    // spawn spiders
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
    this.sfx.music1.play();
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    // add a small 'up & down' animation via a tween
    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};


//COLLISIONS ----------------------------------------------------
//---------------------------------------------------------------
PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
    this.game.physics.arcade.overlap(this.hero, this.spiders,
        this._onHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey,
        null, this)
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
        // ignore if there is no key or the player is on air
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this);
};

PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
        hero.bounce();
        enemy.die();
        
        this.sfx.ouch.play();
    }
    else { // game over -> restart the game
        this.sound.stopAll(); ﻿
        this.sfx.stomp.play();
        this.game.state.restart();
    }
};

PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    this.sound.stopAll(); ﻿ ﻿
    this.sfx.win.play();

    this.game.state.restart();
    // TODO: go to the next level instead
};

//--------------------------------------------------------------
PlayState._handleInput = function () {
    
	if (gyro!=0){
		this.hero.move(gyro);
	}

    else if (this.keys.left.isDown) { // move hero left
        if (this.keys.run.isDown) {
        	this.hero.move(-2);
        }
        else{	
        this.hero.move(-1);
    	};
    }
    else if (this.keys.right.isDown) { // move hero right
        if (this.keys.run.isDown) {
        	this.hero.move(2);
        }
        else{	
        this.hero.move(1);
    	};
    }
    else { // stop
        this.hero.move(0);
    };

    if(this.game.input.activePointer.isDown﻿){

    	this.hero.jump();
    	this.sfx.jump.play();
    	
    }

    this.keys.up.onDown.add(function () {
    this.hero.jump();
}, this);

};






//HERO ----------------------------------------------------
//---------------------------------------------------------
function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
}

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.update = function () {
    // update sprite animation, if it needs changing
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
};

Hero.prototype.move = function (direction) {
    //this.x += direction * 2.5; // 2.5 pixels each frame: we substitute this in order to manage it with the physics engine

    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;
    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    //this.body.velocity.y = -JUMP_SPEED;
	let canJump = this.body.touching.down;
	
    if (canJump) {
        dobleSalt=1;
        this.body.velocity.y = -JUMP_SPEED;
    }
    else if(dobleSalt==1 & dobleSaltON==1){
    	dobleSalt=0;
    	this.body.velocity.y = -JUMP_SPEED;
    	
    }

    return canJump;
};

Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype._getAnimationName = function () {
    let name = 'stop'; // default animation

    // jumping
    if (this.body.velocity.y < 0) {
        name = 'jump';
    }
    // falling
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        name = 'fall';
    }
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        name = 'run';
    }

    return name;
};


//SPIDER --------------------------------------------------
//---------------------------------------------------------
function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    // anchor
    this.anchor.set(0.5);
    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;

    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);

}

Spider.SPEED = 100;

// inherit from Phaser.Sprite
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED; // turn right
    }
};

Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};




