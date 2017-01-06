jQuery(document).ready(function($){
	//hides player controls
	//if(typeof _youtube!=='undefined') _youtube.player_vars.controls = 0;

	$(document).on('click','.player_area>img',function(){
		$(this).parents('.player_area').siblings('.list').children('.item').first().click();
	});

	$(document).on('click','.list .item',function(){
		//toggle active state on clicked item, remove on others
		$(this).addClass('active').siblings('.active').removeClass('active');

		var list = $(this).parents('.list'),
			player = list.siblings('.player_area');

		if(player.find('iframe').is('*')){
			//-- autoplay video
			_youtube.player.master_player.loadVideoById($(this).attr('data-vid'));
			
			//-- load video, no autoplay
			//_youtube.player.master_player.cueVideoById($(this).attr('data-vid'));
		} else {
			player.addClass('active').find('.player>div').addClass('youtube_js').attr('data-vid',$(this).attr('data-vid'));

			//-- autoplay video
			_youtube.reload($(this).attr('data-vid'));

			//-- load video, no autoplay
			//_youtube.reload();
		}
	});
});