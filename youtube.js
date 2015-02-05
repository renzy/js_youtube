//console catcher
(function(w,f,o,c,a){ if(!w[c]){ for(i=0;i<a.length;i++) o[a[i]]=f; w[c]=o; } })(window,function(){},{},'console',['warn','trace','timeEnd','time','profileEnd','profile','markTimeline','log','info','groupEnd','groupCollapsed','group','exception','error','dirxml','dir','debug','count','assert','clear','table','timeStamp']);

//youtube object
var _youtube = {  
	debug: 			/([\?|&|#]debug)/.test(window.location.search) ? true : false,
	loaded: 		false,

	init: function(){
		if(this.loaded){
			if(this.debug) console.log('_youtube:init()');
			this.ratio = 16/9;
			this.player = {};
			this.player_count = 0;

			this.combo = {
				frame: document.getElementsByTagName('iframe'),
				div: document.getElementsByClassName('youtube_js')
			};

			for(var type in this.combo){
				for(var i=0; i<this.combo[type].length; i++){
					try {
						if(this.combo[type][i].getAttribute('data-vid')!=null){
							var item = this.combo[type][i],
								ele_id = item.getAttribute('id'),
								vid_id = item.getAttribute('data-vid'),
								dim = {
									width: (item.getAttribute('width')!=null) 
										? item.getAttribute('width')
										: '100%',
									height: (item.getAttribute('height')!=null) 
										? item.getAttribute('height')
										: '100%'
								};

							//set up iframes
							if(type=='frame' && /youtube\.com/gi.test(item.getAttribute('src'))){
								this.player[ele_id] = new YT.Player(ele_id,{
									events: { 'onStateChange': this.player_state_change }
								});

								if(dim.width=='100%'){
									item.parentNode.setAttribute('style', 'height:'+(get_width(item.parentNode)/this.ratio)+'px');
									item.setAttribute('width','100%');
									item.setAttribute('height','100%');
								}
							} 

							//set up elements with youtube_js class
							else if(type=='div'){
								if(dim.width=='100%')
									item.parentNode.setAttribute('style', 'height:'+(get_width(item.parentNode)/this.ratio)+'px');

								this.player[ele_id] = new YT.Player(ele_id,{
									width: dim.width,
									height: dim.height,
									videoId: vid_id,
									events: { 'onStateChange': this.player_state_change }
								});
							}

							this.player_count++;
						}
					} catch(err){
						if(this.debug) console.log(err);
					}
				}
			}

			if(this.debug) console.log('\tyoutube videos configured: '+this.player_count);
		}
	},

	alter: function(){
		if(_youtube.debug){
			console.log('_youtube:alter()');
			if(this.player_play.override) console.log('\tplayer_play.override active');
			if(this.player_play.append) console.log('\tplayer_play.append active');
		}

		this.init();
	},

	player_state_change: function(e){
		if(_youtube.debug) console.log('_youtube:player_state_change() '+e.data);

		var data = e.target.getVideoData();
		switch(e.data){
			case YT.PlayerState.PLAYING:
				_youtube.player_play.default(e);
				break;
			case YT.PlayerState.PAUSED:
				_youtube.player_pause.default(e);
				break;
			case YT.PlayerState.ENDED:
				_youtube.player_end.default(e);
				break;
		}
	},

	player_play: {
		override: false,
		append: false,
		default: function(e){
			var data = e.target.getVideoData();

			if(_youtube.debug){
				console.log('\tstate: playing');
				console.log('\tvideo_id: '+data.video_id)
			}
			
			if(!this.override){
				//pause other players if playing
				for(var i in _youtube.player){
					var player = _youtube.player[i];
					if(player.getPlayerState()==1 && player.getVideoData().video_id!=data.video_id){
						player.pauseVideo();
						if(_youtube.debug) console.log('\tpause player_id: '+i);
					}

					if(player.getVideoData().video_id==data.video_id) _youtube.active = i;
				}
			} else {
				if(_youtube.debug) console.log('_youtube:player_play.override()');
				this.override(e);
			}

			if(this.append){
				if(_youtube.debug) console.log('_youtube:player_play.append()');
				this.append(e);
			}
		}	
	},

	player_pause: {
		append: false,
		default: function(e){ 
			if(this.append){
				if(_youtube.debug) console.log('_youtube:player_pause.append()');
				this.append(e);
			}
		}
	},

	player_end: {
		append: false,
		default: function(e){ 
			if(this.append){
				if(_youtube.debug) console.log('_youtube:player_end.append()');
				this.append(e);
			}
		}
	}
};


if(typeof YT!=='object'){
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/player_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady(){ 
	_youtube.loaded = true;
	_youtube.init(); 
}
function onYouTubePlayerReady(){ _youtube.init(); }


function get_width(e) {
	var styles = window.getComputedStyle(e),
		padding = parseFloat(styles.paddingLeft)+parseFloat(styles.paddingRight);
	return e.clientWidth-padding;
}