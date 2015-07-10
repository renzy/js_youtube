//console catcher
(function(w,f,o,c,a){ if(!w[c]){ for(i=0;i<a.length;i++) o[a[i]]=f; w[c]=o; } })(window,function(){},{},'console',['warn','trace','timeEnd','time','profileEnd','profile','markTimeline','log','info','groupEnd','groupCollapsed','group','exception','error','dirxml','dir','debug','count','assert','clear','table','timeStamp']);

//youtube object
var _youtube = {  
	debug: 			/([\?|&|#]debug)/.test(window.location.search) ? true : false,
	loaded: 		false,
	auto_play_id: 	false,
	player_vars: 	{ rel:0, showinfo:0, autoplay:0 },

	init: function(inbound){
		if(this.loaded){
			var inbound = (typeof inbound!=='undefined') ? inbound : false,
				combo = document.querySelectorAll('iframe, .youtube_js'),
				attr = ['id','class','data-vid','src','width','height'];

			if(this.debug) console.log('_youtube:init()');
			this.ratio = { width:16, height:9 };
			this.ratio.percent = (this.ratio.height/this.ratio.width)*100;
			
			if(typeof this.player==='undefined'){
				this.player = {};
				this.player_count = 0;
			}

			for(var i=0; i<combo.length; i++){
				try {
					//set element attributes
					var item = {
						type: (typeof combo[i].tagName!=='undefined') ? combo[i].tagName.toLowerCase() : false,
						obj: combo[i]
					};
					for(var a=0; a<attr.length; a++){
						item[attr[a].replace('-','_')] = (typeof item.obj.getAttribute(attr[a])!=='undefined' && item.obj.getAttribute(attr[a])!=null)
							? item.obj.getAttribute(attr[a])
							: false;

						//set dimensions to 100% by default if not set
						if(/width|height/.test(attr[a]))
							item[attr[a]] = '100%';
					}

					//generate data-vid from other attributes if possible
					if(!item.data_vid){
						if(item.src && /youtu\.?be/gi.test(item.src) && /[a-z0-9_-]{11}/gi.test(item.src))
							item.data_vid = item.src.replace(/.*?(^|\/|v=)([a-z0-9_-]{11})(.*)?/i,'$2');
						else if(item.class && item.id && /youtube_js/gi.test(item.class) && /^[a-z0-9_-]{11}$/i.test(item.id))
							item.data_vid = item.id;

						if(item.data_vid)
							item.obj.setAttribute('data-vid',item.data_vid);
					}

					//couldnt find video id, skip this element
					if(!item.data_vid) continue;

					//set value for empty ids, catch for more than one element with the same id
					if(!item.id){
						item.id = this.generate_id();
						item.obj.setAttribute('id',item.id);
					} else if(this.id_exists(item.id)>1){
						item.id = this.generate_id(item.id);
						item.obj.setAttribute('id',item.id);
					}

					//set up new player
					if(typeof this.player[item.id]==='undefined'){
						var wrapper = document.createElement('div');
						wrapper.setAttribute('class','youtube_pod');
						wrapper.appendChild(item.obj.cloneNode(true)); 
						item.obj.parentNode.replaceChild(wrapper,item.obj);
						item.obj = document.getElementById(item.id);

						//responsive attributes
						if(item.width=='100%')
							this.responsive_attributes(item.obj);

						var param = {  
							events: { onStateChange: this.player_state_change },
							playerVars: this.player_vars
						};

						if(item.type!='frame'){
							param.width = item.width;
							param.height = item.height;
							param.videoId = item.data_vid;

							if(this.auto_play_id && this.auto_play_id==item.id)
								param.playerVars.autoplay = 1;
						}

						this.player[item.id] = new YT.Player(item.id,param);

						if(this.debug){
							console.log('\tplayer for #'+item.id+' configured');
						}

						this.player_count++;
					}
				} catch(err){
					if(this.debug) console.log(err);
				}
			}

			if(this.player_count>0){
				for(var i in this.player){
					if(!this.id_exists(i)){
						if(this.debug) console.log('\tremoved player '+i);
						delete this.player[i];
						this.player_count--;
					}		
				}
			}

			if(this.debug) console.log('\tyoutube videos configured: '+this.player_count);
		}
	},

	reload: function(auto_play_id){
		this.auto_play_id = (typeof auto_play_id!=='undefined') ? auto_play_id : false;
		this.init('reload');
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
				if(_youtube.player.length>1){
					for(var i in _youtube.player){
						var player = _youtube.player[i];
						console.log(e.target.d);
						if(player.getPlayerState()==1 && i!=e.target.d.getAttribute('id')){
							player.pauseVideo();
							if(_youtube.debug) console.log('\tpause player_id: '+i);
						}
					}
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
	},

	player_stop_all: function(){
		for(var i in _youtube.player){
			var player = _youtube.player[i];

			if(player.getPlayerState()==1){
				player.pauseVideo();
				if(_youtube.debug) console.log('\tpause player_id: '+i);
			}
		}
	},

	id_exists: function(id){
		var count = document.querySelectorAll('#'+id).length;
		return (count==0) ? false : count;
	},

	generate_id: function(prefix){
		var prefix = (typeof prefix!=='undefined') 
			? ((/^[0-9]/.test(prefix)) ? 'v'+prefix : prefix)
			: 'auto';

		do var id=prefix+'_'+this.generate_unique();
		while(this.id_exists(id));
		return id;
	},

	generate_unique: function(){
		var date = new Date(),
			uni = String(date.getHours())+String(date.getMinutes())+String(date.getSeconds())
		return uni;
	},

	generate_source: function(vid){
		var vid = (typeof vid!=='undefined' && /[a-z0-9_-]{11}/gi.test(vid)) 
			? vid.replace(/.*?(^|\/|v=)([a-z0-9_-]{11})(.*)?/i,'$2') 
			: false;
		return (!vid) 
			? false
			: '<div id="'+this.generate_id(vid)+'" data-vid="'+vid+'" class="youtube_js"></div>';
	},

	fetch_images: function(id){
		var type=['0','1','2','3','default','hqdefault','mqdefault','sddefault','maxresdefault'],
			base = '//img.youtube.com/vi/',
			item = {};
		for(var x=0; x<type.length; x++)
			item[type[x]] = base+id+'/'+type[x]+'.jpg';
		return item;
	},

	responsive_attributes: function(item){
		item.parentNode.setAttribute('style','height:0;position:relative;padding-bottom:'+this.ratio.percent+'%;');
		item.setAttribute('height','100%');
		item.setAttribute('width','100%');
		item.setAttribute('style','position:absolute;');
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