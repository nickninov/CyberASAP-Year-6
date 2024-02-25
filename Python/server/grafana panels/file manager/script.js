/*----------Folder And Files Icons---------------|START---------*/
$('.big-file-manager.theme-structure ul > li > b').contents().filter(function() {
    return this.nodeType == 3 && $.trim(this.textContent) != '';
}).wrap('<span autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="false" class="name" />');
function filesAndFolderIcons(newData) {
    function letGoSmallA(a) {
        var getType = $(a).attr('data-file-icon');
        if (getType == "folder") {
            $(a).children('b').prepend('<i class="fas fa-folder"></i>');
        } else if (getType == "html" || getType == "css" || getType == "js" || getType == "php") {
            $(a).children('b').prepend('<i class="fas fa-file"></i>');
        } else if (getType == "layout") {
            $(a).children('b').prepend('<i class="fas fa-th-large"></i>');
        } else if (getType == "image") {
            $(a).children('b').prepend('<i class="far fa-images"></i>');
        } else if (getType == "video") {
            $(a).children('b').prepend('<i class="fas fa-video"></i>');
        }
    }
    if (newData == "newData") {
        $('[data-new="new"][data-file-icon]').each(function() {
            letGoSmallA(this);
        });
    } else {
        $('[data-file-icon]').each(function() {
            letGoSmallA(this);
        });
    }
}
filesAndFolderIcons();
/*----------Folder And Files Icons---------------|END-------*/

/*----------Folder Default Behaviour----------|START------*/
$('.big-file-manager > ul').addClass('active-folder-wrapper');
$('.big-file-manager').addClass('small');
function allStructure(newData) {
	function letGoSmallB(){
		$('.big-file-manager ul li[data-file-icon="folder"]:not(:has(ul))').addClass('empty-folder');
		$('.empty-folder').each(function(){
			$(this).find('.no-item-inside-folder').remove();
			$(this).append('<ul class="no-item-inside-folder"><span>This folder has no items.</span></ul>');
		});
		$('.big-file-manager ul li:has(ul)').addClass('has-files-of-folder');
		$('.has-files-of-folder').each(function(){
			$(this).find('.cm-folder-back').remove();
			$(this).children('b').prepend('<i title="Back" class="cm-folder-back"><i class="fas fa-angle-left"></i></i>');
		});
		
	}
	if (newData == "newData") {
        letGoSmallB();
    } else {
        letGoSmallB();
    }
}
allStructure();
$(document).on('dblclick', '.big-file-manager ul li.has-files-of-folder', function(e) {
    $('.big-file-manager ul').removeClass('active-folder-wrapper');
    $(this).children('ul').addClass('active-folder-wrapper');
    $(this).siblings('li').hide();
    $(this).addClass('file-sub-active').children('ul').show();
});
$(document).on('dblclick', '.big-file-manager ul li.has-files-of-folder', function(e) {
    $('.has-files-of-folder').removeClass('show-up').addClass('hide-up');
    $(this).addClass('show-up').removeClass('hide-up');
});
$(document).on('dblclick', '.big-file-manager ul li', function(e) {
    e.stopPropagation();
});
$(document).on('click', '.cm-folder-back', function(e) {
    e.stopPropagation();
    $('.big-file-manager ul').removeClass('active-folder-wrapper');
    $(this).parent('b').closest('ul').addClass('active-folder-wrapper');
    $(this).closest('.file-sub-active').siblings('li').show();
    $(this).closest('.file-sub-active').removeClass('file-sub-active');
    $(this).closest('.has-files-of-folder').find('ul').hide();
    $('.has-files-of-folder').removeClass('show-up').addClass('hide-up');
    $(this).closest('.file-sub-active').addClass('show-up').removeClass('hide-up');
    $(this).parent('b').next('ul').children('li').removeClass('select');
});
$(document).on('dblclick click','.big-file-manager ul li,.cm-folder-back',function(e) {
    var text = $('.show-up[data-file-icon]').attr('data-path');
	if(text){
		if(text.indexOf("/")){
			$('.address-search-input').val(text);
			var getAddressData = text.toString().split('/');
			$('.address-short-btn').empty();
			for(var i=0;i<getAddressData.length;i++){
				$('.address-short-btn').append('<div data-address><span>'+getAddressData[i]+'</span><i class="fas fa-caret-right"></i></div>');
			}
			var getSearchPlaceholder = $('.big-file-manager.theme-structure ul > li.show-up > b').text();
			$('.files-search-input').attr('placeholder','Search in '+getSearchPlaceholder);
		}else{
			$('.address-short-btn').empty();
			$('.address-short-btn').append('<div data-address><span>'+text+'</span></div>');
			$('.files-search-input').attr('placeholder','Search..');
		}
	}else{
		$('.address-short-btn').empty();
		$('.address-search-input').val('');
		$('.files-search-input').attr('placeholder','Search..');
		return false;
	}
});
/*----------Folder Default Behaviour----------|END------*/
/*---------Context Menu Start------------|START---------*/

$(document).on('click contextmenu dblclick', function() {
    $('[data-file-icon]').removeClass('context-visible').removeClass('select renaming');
    $('.append-option-box').remove();
	removeUnwanted();
	$('.name').attr('contenteditable', false);
});
$(document).on('click contextmenu', '.append-option-box', function(e) {
    e.stopPropagation();
    $('[data-file-icon]').removeClass('context-visible').removeClass('select');
    $('.append-option-box').remove();
});
$(document).on('click contextmenu', '[data-file-icon]', function(e) {
    e.stopPropagation();
});

function pasteData() {
    $('.data-moving').each(function() {
        if ($('.active-folder-wrapper:has(.no-item-inside-folder)')) {
            $('.active-folder-wrapper.no-item-inside-folder').children('span').remove();
            $('.active-folder-wrapper.no-item-inside-folder').removeClass('no-item-inside-folder');
            $(this).clone().removeClass('data-copy').appendTo('.active-folder-wrapper');
            $('.active-folder-wrapper').find('li').show();
            $('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
            $(this).remove();
        } else {
            $(this).clone().removeClass('data-copy').appendTo('.active-folder-wrapper');
            $('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
            $(this).remove();
        }
    });
    $('.data-copy').each(function() {
        if ($('.active-folder-wrapper:has(.no-item-inside-folder)')) {
            $('.active-folder-wrapper.no-item-inside-folder').children('span').remove();
            $('.active-folder-wrapper.no-item-inside-folder').removeClass('no-item-inside-folder');
            $(this).clone().removeClass('data-copy').appendTo('.active-folder-wrapper');
            $('.active-folder-wrapper').find('li').show();
            $('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
        } else {
            $(this).clone().removeClass('data-copy').appendTo('.active-folder-wrapper');
            $('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
        }
    });
}

function deleteData() {
    var r = confirm("Are you Sure To Delete.");
    if (r == true) {
        $('.select').remove();
        return false;
    } else {
        return false;
    }
}
function renameData(renameClass) {
    $('.renaming').removeClass('renaming');
    $(renameClass).closest('li').addClass('renaming');
    $(renameClass).closest('li').find('.name').attr('contenteditable', true).select().focus();
    $('.renaming').removeClass('select');
}
;
/*---------Select Folder------------|START---------*/
$(document).on('click', '[data-file-icon]', function(e) {
    if (e.ctrlKey) {
        $(this).addClass('select');
		$(this).removeClass('renaming');
    } else {
        $('.select').removeClass('select');
        $(this).addClass('select').siblings().removeClass('select');
		$(this).removeClass('renaming');
    }
});
/*---------Select Folder------------|END---------*/
/*---------Open Data Context Menu------------|START---------*/
$(document).on('click', '[data-function="data-open"]', function() {
    $('.select').dblclick();
});
/*---------Open Data Context Menu------------|END---------*/
/*---------Move Data Context Menu------------|START---------*/
$(document).on('click', '[data-function="data-move"]', function() {
	$('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
	$('.select').addClass('data-moving').removeClass('data-copy');
});
/*---------Move Data Context Menu------------|END---------*/
/*---------Copy Data Context Menu------------|START---------*/
$(document).on('click', '[data-function="data-copy"]', function() {
	$('.data-moving,.data-copy').removeClass('data-moving').removeClass('data-copy');
	$('.select').addClass('data-copy').removeClass('data-moving');
});
/*---------Copy Data Context Menu------------|END---------*/
/*---------Paste Data------------|START---------*/
$(document).on('click', '[data-function="paste-data"]', function() {
    pasteData();
});
/*---------Paste Data------------|END---------*/
/*---------Properties Context Menu------------|START---------*/
$(document).on('click', '[data-function="data-properties"]', function() {
    $('.cm-properties-popup-section').addClass('open');
});
$(document).on('click', '.cm-properties-close', function() {
    $('.cm-properties-popup-section').removeClass('open');
});
/*---------Properties Context Menu------------|END---------*/
/*---------Rename File and Folder------------|START---------*/
$(document).on('click', '[data-function="data-rename"]', function() {
    renameData(this);
});
/*---------Rename File and Folder------------|END---------*/
/*---------Delete File and Folder------------|START---------*/
$(document).on('click', '[data-function="data-delete"]', function() {
    deleteData();
    createFileAndFolderDataBase();
});
/*---------Delete File and Folder------------|END---------*/
/*---------Copied to Clipboard------------|START---------*/
function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    var txt = '{{ ' + $(element).closest('[data-file-id]').attr('data-file-id') + ' }}';
    $temp.val(txt).select();
    document.execCommand("copy");
    $temp.remove();
    $('.theme-structure').append('<div class="copied">Copied !</div>');
    setTimeout(function() {
        $('.copied').addClass('copied-visible');
    }, 500);
    setTimeout(function() {
        $('.copied').remove();
    }, 3000);
}

function copyToClipboardPath(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    var txt = $(element).closest('[data-path]').attr('data-path');
    $temp.val(txt).select();
    document.execCommand("copy");
    $temp.remove();
    $('.theme-structure').append('<div class="copied">Copied !</div>');
    setTimeout(function() {
        $('.copied').addClass('copied-visible');
    }, 500);
    setTimeout(function() {
        $('.copied').remove();
    }, 3000);
}
$(document).on('click', '[data-function="data-copy-secure-path"]', function() {
    copyToClipboard(this);
});
$(document).on('click', '[data-function="data-copy-path"]', function() {
    copyToClipboardPath(this);
});
/*---------Copied to Clipboard------------|END---------*/
/*----------Creating Path For Data------------|START----------*/
/*function getChilrenPath(path){
	var a = $(path).attr('data-slug');
	var b = $(path).closest('ul').closest('[data-slug]').attr('data-slug');
	if(typeof b === 'undefined'){
		b="";
		var c = b+"/"+a;
	}else{
		var c = "/"+b+"/"+a;
	}
	return c;
}*/
function createFileAndFolderDataBase() {
    $('.big-file-manager.theme-structure > ul li').each(function() {
        var folderSlug = $(this).children('b').not('.cm-folder-back').text().toLowerCase().split(' ').join('-');
        $(this).attr('data-slug', folderSlug);
    });
    $('[data-slug]').each(function() {
        var b = $(this).attr('data-slug');
        var a = $(this).parents('li').map(function() {
            return $(this).attr('data-slug');
        }).get().reverse().join("/");
		if(a==""){
			$(this).attr('data-path',b);
		}else{
			$(this).attr('data-path', a + "/" + b);
		}
        
    });
    var folderStructureJson = [];
    $('[data-file-id]').each(function() {
        var folderStructure = {};
        var fileID = $(this).attr('data-file-id');
        var filePath = $(this).attr('data-path');
        folderStructure.fileID = "{{" + fileID + "}}";
        folderStructure.filePath = filePath;
        folderStructureJson.push(folderStructure);
    });
}
createFileAndFolderDataBase();
/*----------Creating Path For Data------------|END----------*/
/*-------Folder And Files Size-----------------------|START-------*/
$(document).on('click', '[data-size]', function() {
    var getSize = $(this).attr('data-size');
    $('.big-file-manager').removeClass('small medium large');
    $('.big-file-manager').addClass(getSize);
});
/*-------Folder And Files Size-----------------------|END-------*/
/*----------------New Folder---------------------|START------------*/
function removeUnwanted(){
	$('.active-folder-wrapper ~ .active-folder-wrapper,.active-folder-wrapper ~ .no-item-inside-folder').remove();
}
$(document).on('click', '[data-function="new-folder"]', function() {
	$('.no-item-inside-folder.active-folder-wrapper').empty().removeClass('no-item-inside-folder').addClass('active-folder-wrapper');
    $('.active-folder-wrapper').append('<li data-file-icon="folder" data-new="new" data-cloud="load"><b>New Folder</b></li>');
    filesAndFolderIcons('newData');
    allStructure();
    createFileAndFolderDataBase();
    $('[data-new="new"]').removeAttr('data-new');
	removeUnwanted();
});
$('.address-search-input').focus(function(){
	$('.address-short-btn').hide();
	$(this).select();
}).blur(function(){
	$('.address-short-btn').show();
});
/*$(document).on('click','.address-button',function() {
	var getAddressInput = $('.address-search-input').val().toString().trim();
	$('[data-path]').removeClass('show-up');
	$('[data-path="'+getAddressInput+'"]').addClass('show-up');
	$('.big-file-manager.theme-structure ul').removeClass('active-folder-wrapper');
	$(this).children('ul').addClass('active-folder-wrapper');
});*/
/*----------------New Folder---------------------|START------------*/