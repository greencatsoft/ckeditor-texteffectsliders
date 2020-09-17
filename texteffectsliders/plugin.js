/**
 * Combined slider controls for adjusting shadow and outline of texts.
 *
 * @license Copyright (c) 2020, Green Cat Software - Sungjin Kim. All rights reserved.
 */
CKEDITOR.plugins.add( 'texteffectsliders', {
	requires: 'panelbutton,floatpanel',
	lang: 'en,ko', // %REMOVE_LINE_CORE%
	icons: 'texteffectsliders', // %REMOVE_LINE_CORE%
	hidpi: false, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		var lang = editor.lang.texteffectsliders,
			cssPath = this.path + 'skins/default.css';

		var getConfig = function( value, defaultValue) {
			return value === undefined ? defaultValue : value;
		};

		var controls = {
			shadow: new CKEDITOR.effectorControl(
				{
					name: 'shadow',
					horizontal: {
						min: getConfig( CKEDITOR.config.horizontal_min, -100 ),
						max: getConfig( CKEDITOR.config.horizontal_max, 100 ),
						step: getConfig( CKEDITOR.config.horizontal_step, 1 )
					},
					vertical: {
						min: getConfig( CKEDITOR.config.vertical_min, -100 ),
						max: getConfig( CKEDITOR.config.vertical_max, 100 ),
						step: getConfig( CKEDITOR.config.vertical_step, 1 )
					},
					blur: {
						min: getConfig( CKEDITOR.config.blur_min, 0 ),
						max: getConfig( CKEDITOR.config.blur_max, 100 ),
						step: getConfig( CKEDITOR.config.blur_step, 1 )
					},
					transparency: {
						min: getConfig( CKEDITOR.config.transparency_min, 0 ),
						max: getConfig( CKEDITOR.config.transparency_max, 1 ),
						step: getConfig( CKEDITOR.config.transparency_step, 0.1 )
					}
				},
				editor ),
			outline: new CKEDITOR.effectorControl(
				{
					name: 'outline',
					width: {
						min: getConfig(CKEDITOR.config.width_min, 0),
						max: getConfig(CKEDITOR.config.width_max, 50),
						step: getConfig(CKEDITOR.config.width_step, 1)
					}
				},
				editor )
		};

		var styles = [];

		for ( var name in controls ) {
			var control = controls[name];
			styles.push( control.createStyle() );
		}

		editor.ui.add( 'texteffectsliders', CKEDITOR.UI_PANELBUTTON, {
			label: lang.title,
			title: lang.title,
			modes: {
				wysiwyg: 1
			},
			editorFocus: 0,
			toolbar: 'styles,' + 40,
			allowedContent: styles,
			panel: {
				css: CKEDITOR.skin.getPath( 'panel' ),
				attributes: {
					role: 'listbox',
					'aria-label': lang.title
				}
			},
			onBlock: function( panel, block ) {
				var document = block.element.getDocument();

				document.appendStyleSheet( cssPath );
				document.getBody().setStyle( 'overflow', 'hidden' );

				block.autoSize = true;
				block.element.addClass( 'cke_texteffectslidersblock' );

				for ( var id in controls ) {
					controls[id].render( block.element );
				}
			},
			onOpen: function() {
				var selection = editor.getSelection(),
					block = selection && selection.getStartElement(),
					path = editor.elementPath( block );

				for ( var id in controls ) {
					controls[id].update( path, block );
				}
			}
		});
	}
} );

CKEDITOR.effectorControl = CKEDITOR.tools.createClass({
	$: function( settings, editor ) {
		this.settings = settings;
		this.editor = editor;
		this.definition = editor.config[ 'texteffectsliders_' + settings.name + 'Style' ];
	},
	proto: {
		createStyle: function( args ) {
			return new CKEDITOR.style( this.definition, args );
		},
		setValue: function( value, cls ) {
			if ( !this.element ) return;
			if ( !cls.endsWith( 'color' ) ) {
				this.element.findOne( 'input.' + cls ).$.value = value;
				this.element.findOne( 'span.' + cls ).setHtml(value);
			}

			var style, args, rgb,
				startElement = this.editor.getSelection().getStartElement(),
				size = this.convertToFloat( startElement.getComputedStyle( 'font-size' ) ),
				attrs = this.definition.getStyleValues( startElement );

			if ( cls.startsWith( 'cke_effect-shadow-' ) ) {
				var rgba = this.convertColorToRgba( attrs[0] );

				args = {
					horizontal: this.convertToFloat( attrs[1] ) / size,
					vertical: this.convertToFloat( attrs[2] ) / size,
					blur: this.convertToFloat( attrs[3] ),
					transparency: rgba[3],
					color: rgba[0] + ',' + rgba[1] + ',' + rgba[2]
				}

				if (cls.endsWith( 'horizontal' )) {
					args.horizontal = value / 100;
				} else if (cls.endsWith( 'vertical' )) {
					args.vertical = value / 100;
				} else if (cls.endsWith( 'blur' )) {
					args.blur = value / 10;
				} else if (cls.endsWith( 'transparency' )) {
					args.transparency = value;
				} else {
					rgb = this.convertColorToRgba( value );

					args.color = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
				}

				style = this.createStyle(args);
			} else if (cls.startsWith( 'cke_effect-outline' )) {
				args = {
					width: this.convertToFloat( attrs[1] ) / size,
					color: attrs[0]
				}

				if (cls.endsWith( 'width' )) {
					args.width = value / 100;
				} else {
					args.color = value;
				}

				style = this.createStyle(args);
			}

			var path = this.editor.elementPath();

			if ( path && style.checkApplicable( path, this.editor ) ) {
				var selection = this.editor.getSelection();
				var locked = selection.isLocked;
				var bookmarks = selection.createBookmarks();

				if (locked) {
					selection.unlock();
				}

				style.apply(this.editor);

				selection.selectBookmarks(bookmarks);

				if (locked) {
					selection.lock();
				}
			}
		},
		setEnabled: function ( value ) {
			if ( !this.element ) return;

			var inputs = this.element.find( 'input' ).toArray(),
				labels = this.element.find( 'span' ).toArray();

			for ( i in inputs) inputs[i].$.disabled = !value;

			if ( value ) {
				this.element.removeClass( 'disabled' );
			} else {
				this.element.addClass( 'disabled' );
				for ( i in inputs ) inputs[i].$.value = 0;
				for ( i in labels ) labels[i].setHtml( '-' );
			}
		},
		convertToFloat: function( value ) {
			var val = parseFloat( value, 10 );

			return isNaN(val) ? 0 : val;
		},
        convertColorToRgba: function(color) {
		    if (!color) return;
            if (color[0] === '#' ) {
                if (color.length < 7) {
                    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '' );
                }
                return [parseInt(color.substr(1, 2), 16),
                    parseInt(color.substr(3, 2), 16),
                    parseInt(color.substr(5, 2), 16),
                    color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
            }
			if (color.indexOf( 'rgba' ) === -1) color += ',1';
			return color.match(/[\.\d]+/g).map(function (a) {
				return +a
			});
        },
		render: function( parent ) {
			var onChange = CKEDITOR.tools.addFunction( function ( value, cls, saveSnapshot ) {
				this.setValue( value, cls );

				if ( saveSnapshot ) {
					this.editor.fire( 'saveSnapshot' );
				}
			}, this );

			var lang = this.editor.lang.texteffectsliders,
				output = [],
				value = 0;

			var renderSlider = function(label, settings, cls) {
				output.push( '<div class="cke_texteffectslider"><label>' );
				output.push(label);
				output.push( '</label><input class="' );
				output.push(cls);
				output.push( '" type="range" ' );
				output.push( ' oninput="CKEDITOR.tools.callFunction( ' );
				output.push(onChange);
				output.push( ', this.value, \'' );
				output.push(cls);
				output.push( '\' );"' );
				output.push( ' onchange="CKEDITOR.tools.callFunction( ' );
				output.push(onChange);
				output.push( ', this.value, \'' );
				output.push(cls);
				output.push( '\', true );" ' );
				output.push( 'step="' );
				output.push(settings.step || 1);
				output.push( '" min="' );
				output.push(settings.min || 0);
				output.push( '" max="' );
				output.push(settings.max || 100);
				output.push( '" /><span class="' );
				output.push(cls);
				output.push( '">' );
				output.push(value);
				output.push( '</span></div>' );
			}

			output.push( '<div id="' );
			output.push( this.settings.name );
			output.push( '" class="cke_texteffectslidercontrol" title="">' );
			output.push( '<div><label>' );
			output.push(lang.effectors[this.settings.name].title);
			output.push( '</label><div class="cke_effect-' );
			output.push(this.settings.name);
			output.push( '-color"></div></div>' );
			if (this.settings.name === 'shadow' ) {
				renderSlider(lang.effectors[this.settings.name].horizontal, this.settings.horizontal, 'cke_effect-shadow-horizontal' );
				renderSlider(lang.effectors[this.settings.name].vertical, this.settings.vertical, 'cke_effect-shadow-vertical' );
				renderSlider(lang.effectors[this.settings.name].blur, this.settings.blur, 'cke_effect-shadow-blur' );
				renderSlider(lang.effectors[this.settings.name].transparency, this.settings.transparency, 'cke_effect-shadow-transparency' );
			} else {
				renderSlider(lang.effectors[this.settings.name].width, this.settings.width, 'cke_effect-outline-width' );
			}
			output.push( '</div>' );

			parent.appendHtml( output.join( '' ) );

			var e = this.editor,
				settings = this.settings;

            parent.findOne( 'div:first-child div.cke_effect-' + settings.name + '-color' ).on( 'click', function () {
				e.getColorFromDialog( function( color ) {
					if ( color ) {
						CKEDITOR.tools.callFunction( onChange, color, 'cke_effect-' + settings.name + '-color' );
					}
				}, this );
			})

			this.element = parent.findOne( '#' + settings.name );
		},
		update: function( path, block ) {
			var values = path ? this.definition.getStyleValues( block ) : undefined;

			var applyValue = function( value, editor, convertToFloat ) {
				var block = editor.getSelection().getStartElement(),
					size = block.getComputedStyle( 'font-size' );

				return convertToFloat(size) !== 0 ? Math.round(convertToFloat( value ) / convertToFloat( size ) * 100) : 0;
			}

			if (values) {
				this.setEnabled(true);

				if ( this.settings.name === 'shadow' ) {
					var inputs = this.element.find( 'input' ).toArray(),
						labels = this.element.find( 'span' ).toArray();

					for ( var i = 0; i < 4; i++) {
						var v = values[i + 1];

						if (i < 2) {
							inputs[i].$.value = applyValue( v, this.editor, this.convertToFloat );
							labels[i].setHtml( applyValue( v, this.editor, this.convertToFloat ) );
						} else if (i === 2) {
							inputs[i].$.value = this.convertToFloat( v ) * 10;
							labels[i].setHtml( this.convertToFloat( v ) * 10 );
						} else {
							var rgba = this.convertColorToRgba( values[0] );

							var transparency = rgba ? rgba[3] : 1

							inputs[i].$.value = transparency;
							labels[i].setHtml( transparency );
						}
					}
				} else {
					this.element.findOne( 'input.cke_effect-outline-width' ).$.value = applyValue( values[1], this.editor, this.convertToFloat )
					this.element.findOne( 'span.cke_effect-outline-width' ).setHtml( applyValue( values[1], this.editor, this.convertToFloat ) );
				}

				this.element.findOne( '.cke_effect-' + this.settings.name + '-color' ).setStyle( 'background-color', values[0] );
			} else {
				this.setEnabled(false);
			}
		}
	}
});

/**
 * @cfg [texteffectsliders_shadowStyle=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.texteffectsliders_shadowStyle = {
	element: 'span',
	styles: { 'text-shadow': 'rgba(#(color), #(transparency)) #(horizontal)em #(vertical)em #(blur)px' },
	getStyleValues: function( block ) {
		var shadow = block.getComputedStyle( 'text-shadow' );
		var color = block.getComputedStyle( 'color' );

		var splitValue = function ( value ) {
			if ( value.startsWith( 'rgb' ) ) {
				var split = value.split( ')' );

				return [split[0] + ')'].concat( split[1].trim().split(" ") )
			} else {
				return value.split( ' ' );
			}
		}

		return shadow !== 'none' ? splitValue(shadow) : [( color !== 'none' ? color : '#000000' ), ' 0em', '0em', '0px'];
	}
};

/**
 * @cfg [texteffectsliders_outlineStyle=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.texteffectsliders_outlineStyle = {
	element: 'span',
	styles: {
		'-webkit-text-stroke-width': '#(width)em',
		'-webkit-text-stroke-color': '#(color)'
	},
	getStyleValues: function( block ) {
		var width = block.getComputedStyle( '-webkit-text-stroke-width' );
		var strokeColor = block.getComputedStyle( '-webkit-text-stroke-color' );
		var fontColor = block.getComputedStyle( 'color' );
		var color = strokeColor !== 'none' ? strokeColor : fontColor !== 'none' ? fontColor : '#000000';

		return [color, (width !== 'none' ? width : '0em')];
	}
};

/**
 * Minimum value for shadow horizontal.
 * @cfg {Number} [horizontal_min=-100]
 * @member CKEDITOR.config
 */

/**
 * Maximum value for shadow horizontal.
 * @cfg {Number} [horizontal_max=100]
 * @member CKEDITOR.config
 */

/**
 * Interval (step) to be used for shadow horizontal.
 * @cfg {Number} [horizontal_step=1]
 * @member CKEDITOR.config
 */

/**
 * Minimum value for shadow vertical.
 * @cfg {Number} [vertical_min=-100]
 * @member CKEDITOR.config
 */

/**
 * Maximum value for shadow vertical.
 * @cfg {Number} [vertical_max=100]
 * @member CKEDITOR.config
 */

/**
 * Interval (step) to be used for shadow vertical.
 * @cfg {Number} [vertical_step=1]
 * @member CKEDITOR.config
 */
/**
 * Minimum value for shadow blur.
 * @cfg {Number} [blur_min=0]
 * @member CKEDITOR.config
 */

/**
 * Maximum value for shadow blur.
 * @cfg {Number} [blur_max=100]
 * @member CKEDITOR.config
 */

/**
 * Interval (step) to be used for shadow blur.
 * @cfg {Number} [blur_step=1]
 * @member CKEDITOR.config
 */
/**
 * Minimum value for shadow transparency.
 * @cfg {Number} [transparency_min=0]
 * @member CKEDITOR.config
 */

/**
 * Maximum value for shadow transparency.
 * @cfg {Number} [transparency_max=1]
 * @member CKEDITOR.config
 */

/**
 * Interval (step) to be used for shadow transparency.
 * @cfg {Number} [transparency_step=0.1]
 * @member CKEDITOR.config
 */
/**
 * Minimum value for outline width.
 * @cfg {Number} [width_min=0]
 * @member CKEDITOR.config
 */

/**
 * Maximum value for outline width.
 * @cfg {Number} [width_max=50]
 * @member CKEDITOR.config
 */

/**
 * Interval (step) to be used for outline width.
 * @cfg {Number} [width_step=1]
 * @member CKEDITOR.config
 */
