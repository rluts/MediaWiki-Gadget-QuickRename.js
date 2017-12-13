/*
* @author RLuts
* @ver 0.2
* Quick Rename
* for ukwiki only
*/

//<nowiki>

$(document).ready(function () {
	if(mw.config.get( 'wgNamespaceNumber' ) === 0 | debug) {
		mw.util.addPortletLink('p-cactions', 'javascript:quickRename.isAna();', 'Запит на перейменування');
	}
});

if (window.quickRename === undefined) {
	window.quickRename = {
		install: function() {
			this.page = 'Вікіпедія:Перейменування статей';
			this.tpl = 'Ana';   
			this.incTpl = 'Rename';
			this.onIncTpl = 'Rename2';
			this.section = 1;
			
			if(debug) {
				this.page = 'User:RLuts/scripttest/QR';
			}
		},
		
		showDialog: function() {
			var qr = this;
			if($('#qr-rename-dialog').length === 0) {
				$( "#mw-content-text" ).append("<div id=\"qr-rename-dialog\" style=\"display:none;\" title=\"Заявка на перейменування статті\"><p style=\"font-size:80%\">Цей інструмент дозволяє спростити процес створення нових заявок на сторінці <a href=\"//uk.wikipedia.org/wiki/Вікіпедія:Перейменування_статей\">Вікіпедія:Перейменування статей</a>. Перед тим як зробити заявку, впевніться, що нова назва більше відповідає нормам української мови та/або <a href=\"//uk.wikipedia.org/wiki/ВП:ІС\">правилам найменування статей у Вікіпедії</a>.</p><p>Введіть нову назву:</p><input id=\"qr-new-name\">\n<p>Причина (вікірозміткою, підпис згенерується автоматично):</p><textarea rows=\"4\" cols=\"50\" id=\"qr-reason\"></textarea>\n</div>");
			}
			mw.loader.using( 'jquery.ui.dialog', function () {
				$( "#qr-rename-dialog" ).dialog({
					buttons: {
						"Додати новий запит": function() {
							qr.isExists();
                		}
            		}
				});
			});
		},
		
		isExists: function() {
			var qr = this;
			this.oldname = mw.config.get( 'wgPageName' );
			this.newname = $('#qr-new-name').val();
			var title = this.page + '/' + this.oldname + ' → ' + this.newname;
			var param = {
				action: 'query',
				list: 'allpages',
				format: 'json',
				titles: title,
				aplimit: '1'
			};
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				if(data.query.pages.hasOwnProperty(-1)) {
					qr.newReq();
				} else {
					$("#qr-rename-dialog").html("Таке перейменування уже обговорювалось<br/><br/><a href=\"" + mw.config.get( 'wgServer' ) + mw.config.get( 'wgArticlePath' ).replace('$1',title) + "\">Перейти до обговорення</a>");
					$("#qr-rename-dialog").dialog({
						buttons: {
							"ОК": function() {
								$( this ).dialog( "close" );
							}
						}
					});
				}
			});
		},
		
		newReq: function() {
			var qr = this;
			var reason = $('#qr-reason').val();
			if( !this.isEmpty( this.newname ) && !this.isEmpty( this.reason )) {
				var title = this.page + '/' + this.oldname + ' → ' + this.newname;
				var content = '=== {{' + this.onIncTpl + '|' + this.oldname + '|' + this.newname + "}} ===\n" + reason + "--~~~~";
				var summary = 'Автоматичне створення нового обговорення ([[ВП:Додатки/QuickRename|QuickRename.js]])';
				$("#qr-rename-dialog").dialog({
					closeOnEscape: false,
					buttons: false
				});
				$( "#qr-rename-dialog" ).html('Створення обговорення');
				mw.loader.using('mediawiki.user', function() {
					qr.writeInPage(title, content, summary, false, false, function() {
						qr.addAna();
					});
				}); 
			} else {
				$( "#qr-rename-dialog" ).append("<br/><span style=\"color: red; font-size: 80%;\">Усі поля повинні бути заповнені</span>");
			}			
		},
		
		addAna: function() {
			var qr = this;
			$( "#qr-rename-dialog" ).html('Вставка шаблону Ana');
			 mw.loader.using('mediawiki.user', function() {
			 	qr.writeInPage(qr.oldname, "{{"+ qr.tpl + "|" + qr.newname + "}}\n","шаблон перейменування статті ([[ВП:Додатки/QuickRename|QuickRename.js]])","prependtext",false,function () {
			 		qr.getMovePage();
			 	});
			 });
		},
		
		getMovePage: function() {
			var qr = this;
			$( "#qr-rename-dialog" ).html('Вставка обговорення на сторінку Вікіпедія:Перейменування статей<br/><br/><span style="color: red;">Будь ласка, не закривайте це вікно. Редагування цієї сторінки може тривати досить довго через велику кількість шаблонів.</span>');
			var param = {
				action: 'query',
				prop: 'revisions',
				format: 'json',
				rvprop: 'content',
				titles: qr.page,
				rvsection: qr.section,
				rvlimit: '1',
				indexpageids: ''
			};
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				if(data.query.pages.hasOwnProperty(-1)) {
					alert('Невдалося завантажити текст сторінки ' + qr.page);
					location.reload();
				}
				var id = data.query.pageids[0];
				var content = data.query.pages[id].revisions[0]['*'];
				content = content.replace(/(--\>\n)/,"$1{{" + qr.incTpl + "|" + qr.oldname + "|" + qr.newname + "}}\n");
				mw.loader.using('mediawiki.user', function() {
					qr.writeInPage(qr.page, content, 'Автоматичне створення нового обговорення ([[ВП:Додатки/QuickRename|QuickRename.js]])', false, qr.section, function () {
						qr.success();
					});
				});
			});
		},
		
		success: function() {
			$( "#qr-rename-dialog" ).dialog("close");
			$( "#qr-rename-dialog" ).remove();
			mw.util.jsMessage("Ваше обговорення успішно додано на сторінку Вікіпедія:Перейменування статей.<br/>Обговорення та стаття також додані у Ваш список спостереження");
		},
		
		writeInPage: function(title, content, summary, option, section, success) {
			var param = {
				action: 'edit', 
				title: title, 
				summary: summary, 
				watchlist: 'watch',
				token: mw.user.tokens.get('editToken'),
				format: 'json'
			};
			param[option || 'text'] = content;
			if(section) {
				param.section = section;
			}
			$.post(mw.util.wikiScript('api'), param, function() {
				if (typeof(success) === 'function') {
					success();
				}
			});
				
		},
		
		isEmpty: function(str) {
			return (!/\S/.test(str));
		},
		
		isAna: function() {
			var qr = this;
			this.install();
			var id = mw.config.get( 'wgArticleId' ); 
			var param = {
				action: 'query',
				list: 'embeddedin',
				format: 'json',
				eititle: 'Template:Ana',
				eicontinue: '10|Ana|' + id,
				eilimit: '1'
			};
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				if(data['query-continue'] && data.query.embeddedin[0].pageid == id) {
					qr.anaExists(); 
				} else {
					qr.showDialog();
				}
			});
		},
		
		anaExists: function() {
			if($( "#qr-ana" ).length === 0) {
				$( "#mw-content-text" ).append("<div id=\"qr-ana\" style=\"display:none;\" title=\"Помилка\"><p>На сторінці знайдено включення шаблону перейменування статей. Можливо перейменування цієї статті уже обговорюється?</p></div>");
			}
			$( "#qr-ana" ).dialog({
				buttons: {
					"ОК": function() {
						$( this ).dialog( "close" );
					}
				}
			});
		}
	};
}

//</nowiki>
