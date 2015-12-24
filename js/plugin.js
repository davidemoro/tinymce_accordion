/**
 * Plone snippet Plugin
 *
 * @author Davide Moro (inspired by Maurizio Lupo's redomino.tinymceplugins.snippet)
 */
(function() {
    var defaultAccordionItem, emptyParagraph, accordionItemSource, accordionItemTemplate,
        accordionSource, accordionTemplate, addAccordionCondition, accordionCondition, version, VK,
        buttonActive;

    VK = tinymce.VK;
    version = '0.1';

    buttonActive = function (funct) {
        var onPostRender;

        onPostRender = function () {
            var ctrl = this;

            ed.on('NodeChange', function(e) {
                ctrl.active(funct(ed, e.element));
            });
        };
        return onPostRender;
    };

    addAccordionCondition = function (ed, element) {
        return ! (ed.dom.getParent(element, '.panel-group') || ed.dom.getParent(element, '.mceTabHeader'));
    };
    accordionCondition = function (ed, element) {
        return ed.dom.getParent(element, '.panel');
    };

    // templates
    defaultAccordionItem = {
        header: 'Header',
        body: '<p>Body</p>'
    };
    emptyParagraph = '<p></p>';
    accordionItemSource = '<div class="panel panel-default">' +
        '  <div class="panel-heading" ' +
        '       role="tab" ' +
        '       id="{{random1}}-{{random2}}{{@index}}-heading">' +
        '    <h4 class="panel-title">' +
        '      <a role="button" ' +
        '         class="accordion-toggle {{#unless @first}}collapsed{{/unless}}"' +
        '         data-toggle="collapse" ' +
        '         {{#unless collapsable}}data-parent="#{{random1}}-accordion"{{/unless}} ' +
        '         href="#{{random1}}-{{random2}}{{@index}}-body" ' +
        '         aria-expanded="true" ' +
        '         aria-controls="{{random1}}-{{random2}}{{@index}}-body">{{{header}}}</a>' +
        '    </h4>' +
        '  </div>' +
        '  <div id="{{random1}}-{{random2}}{{@index}}-body" ' +
        '       class="panel-collapse collapse {{#if @first}}in{{/if}}" ' +
        '       role="tabpanel" ' +
        '       aria-labelledby="{{random1}}-{{random2}}{{@index}}-heading">' +
        '    <div class="panel-body">{{{body}}}</div>' +
        '  </div>' +
        '</div>';
    accordionSource = emptyParagraph +
        '<div class="panel-group {{#if collapsable}}sweet-collapsable{{/if}}" ' +
        '     id="{{random1}}-accordion" ' +
        '     role="tablist" ' +
        '     aria-multiselectable="true">' +
        '  {{#each items}}' +
        '  {{> accordionItem random1=../random1 random2=../random2 collapsable=../collapsable}}' +
        '  {{/each}}' +
        '</div>' +
        emptyParagraph;

    accordionItemTemplate = Handlebars.compile(accordionItemSource);
    Handlebars.registerPartial('accordionItem', accordionItemTemplate);
    accordionTemplate = Handlebars.compile(accordionSource);

    tinymce.PluginManager.requireLangPack('accordion');
    tinymce.create('tinymce.plugins.AccordionPlugin', {
        init: function(ed, url) {
            var buttons;

            // buttons
            buttons = [
                ['accordion',
                 {text: 'accordion.desc',
                  cmd: 'mceAccordion',
                  ui: false,
                  value: {},
                  image: url + '/img/accordion.gif',
                  icon: 'accordion',
                  onPostRenderer: buttonActive(addAccordionCondition)
                 }
                ],
                ['accordionDelete',
                 {text: 'accordion.deletedesc',
                  cmd: 'mceAccordionDelete',
                  image: url + '/img/accordion-delete.gif',
                  icon: 'accordion-delete',
                  onPostRenderer: buttonActive(accordionCondition)
                  }
                ],
                ['accordionItemDelete', {
                  text: 'accordion.itemdeletedesc',
                  cmd: 'mceAccordionItemDelete',
                  image: url + '/img/accordion-item-delete.gif',
                  icon: 'accordion-item-delete',
                  onPostRenderer: buttonActive(accordionCondition)
                  }
                ],
                ['accordionItemInsertAfter', {
                  text: 'accordion.iteminsertafterdesc',
                  cmd: 'mceAccordionItemInsert',
                  ui: false,
                  value: {after: true},
                  image: url + '/img/accordion-item-insert-after.gif',
                  icon: 'accordion-item-insert-after',
                  onPostRenderer: buttonActive(accordionCondition)
                  }
                ],
                ['accordionItemInsertBefore', {
                  text: 'accordion.iteminsertbeforedesc',
                  cmd: 'mceAccordionItemInsert',
                  ui: false,
                  value: {after: false},
                  image: url + '/img/accordion-item-insert-before.gif',
                  icon: 'accordion-item-insert-before',
                  onPostRenderer: buttonActive(accordionCondition)
                  }
                ]
            ];

            // Pre init
            ed.on('PreInit', function () {
                ed.schema.addValidElements('div[role|aria-multiselectable|aria-labelledby|aria-expanded|aria-controls]|a[role|aria-controls]|ul[role]|li[role]');
            });

            // contextual controls
            ed.on('init', function() {
                if (ed && ed.dom.loadCSS) {
                    // load plugin's css
                    // TODO: remove date bogus parameter (useful during development)
                    ed.dom.loadCSS(url + '/css/accordion.css?version=' + version  + '&date=' + new Date().getTime());
                }
                if (ed && ed.plugins.contextmenu) {
                    ed.plugins.contextmenu.on('contextMenu', function(plugin, menu, element) {
                        var groupMenu;
                        if (! ed.dom.getParent(element, '.mceTabHeader')) {
                            // Don't add the accordion/collapsable contextmenu if we are
                            // inside a tabs header
                            if (ed.dom.getParent(element, '.panel-heading')) {
                                menu.removeAll();
                            } else {
                                menu.addSeparator();
                            }
                            groupMenu = menu.addMenu({title : 'accordion.group'});
                            tinymce.each(buttons, function (item){
                                var condition;
                                condition = item[2];
                                if (! condition || condition(ed, element)) {
                                    groupMenu.add(item[1]);
                                }
                            });
                        }
                    });
                }

                // Events
                ed.on('NodeChange', function(ed, cm, e) {
                    // Prevent the p
                    var pElem, parentNode, found;
                    parentNode = e.parentNode;
                    if (e.nodeName == 'BR' && ed.dom.hasClass(parentNode, 'panel-body')) {
                        tinymce.each(parentNode.childNodes, function (block) {
                            if (block.nodeName === 'P') {
                                found = true;
                            }
                        });
                        if (! found) {
                            pElem = ed.dom.create('p', {}, '&nbsp;');
                            parentNode.appendChild(pElem);
                            ed.dom.remove(e);
                            ed.selection.select(pElem);
                        }
                    }
                });
                
                ed.on('KeyDown', function(ed, e) {
                    var range, elem, accordionRootSelector, textContentLength, keyCode, moveKeys, selectedBlocks, found, parent1, parent2;

                    found = false;
                    keyCode = e.keyCode;
                    accordionRootSelector = '.panel-group';
                    moveKeys = [37, // VK.LEFT
                        VK.UP,
                        39, // VK.RIGHT
                        VK.DOWN];
                    elem = ed.selection.getNode();
                    selectedBlocks = ed.selection.getSelectedBlocks();
                    range = ed.selection.getRng();

                    if (ed.dom.hasClass(ed.dom.getNext(elem, '*'), 'panel-group') && keyCode === VK.DELETE) {
                        // Prevent .sweet-tabs delete
                        return tinymce.dom.Event.cancel(e);
                    }
                    if (ed.dom.hasClass(ed.dom.getPrev(elem, '*'), 'panel-group') && keyCode === VK.BACKSPACE) {
                        // Prevent .sweet-tabs delete
                        return tinymce.dom.Event.cancel(e);
                    }

                    // Prevent edit where it shouldn't be possible (mceNotEditable/mceEditable doesn't
                    // work on older versions of TinyMCE)
                    if (ed.dom.getParent(elem, accordionRootSelector)) {
                        if (moveKeys.indexOf(keyCode) === -1) {
                            // Ignore movement keys (arrows)
                            // Prevent element duplication due to "return" key or undesired
                            // editing in not allowed areas (mceNonEditable does not work as
                            // expected on this particular version).
                            if (keyCode === 13) {
                                // we should prevent shift+enter if we are inside of .panel-heading
                                if (ed.dom.getParent(elem, '.panel-title')) {
                                    return tinymce.dom.Event.cancel(e);
                                }
                            }
                            // Prevent undesired tabs markup removals
                            // pressing back delete or canc
                            if (keyCode === VK.BACKSPACE || keyCode === VK.DELETE) {
                                textContentLength = elem.textContent.length;

                                if ((keyCode === VK.BACKSPACE && range.startOffset === 0) ||
                                   (keyCode === VK.DELETE && range.startOffset === textContentLength)) {
                                    if (ed.dom.getParent(elem, '.panel-title')) {
                                        // prevent delete/backspace on headers a
                                        return tinymce.dom.Event.cancel(e);
                                    } else if (ed.dom.hasClass(elem.parentNode), 'panel-group') {
                                        // prevent panel group delete
                                        // Put a cursor at the end of the body, select up to the
                                        // start of the header and press BACKSPACE
                                        return tinymce.dom.Event.cancel(e);
                                    } else if (ed.dom.hasClass(elem.parentNode, 'panel-body')) {
                                       // prevent deleve/backspace on last/first p child of tab-pane
                                       if (keyCode === VK.BACKSPACE && elem.parentNode.firstChild === elem) {
                                            return tinymce.dom.Event.cancel(e);
                                       } else if (keyCode === VK.DELETE && elem.parentNode.lastChild === elem) {
                                            return tinymce.dom.Event.cancel(e);
                                       }
                                    }
                                } else {
                                    // special case for keyCode === VK.BACKSPACE && range.startOffset === 1
                                    // && header a element. If you remove the last character from
                                    // an 'a' node, tinymce erase the entire node instead of leaving
                                    // it empty. This is bad since the 'a' node is required by
                                    // bootstrap, so we need a special rule here.
                                    // The exact opposite for keyCode === VK.DELETE
                                    if (textContentLength === 1 || textContentLength === range.endOffset) {
                                        // the textContentLength == range.endOffset condition is for cursor at the end
                                        // of the header, shift+startline and canc
                                        if ((keyCode === VK.BACKSPACE && range.startOffset === 1) || (keyCode === VK.DELETE && range.startOffset === 0) || (keyCode === VK.DELETE && range.endOffset === textContentLenght)) {
                                            if (elem.nodeName === 'A' && ed.dom.hasClass(elem.parentNode, 'panel-title')) {
                                                ed.dom.setHTML(elem, '&nbsp;');
                                                return tinymce.dom.Event.cancel(e);
                                            }
                                        }
                                    } else if (selectedBlocks.length === 1) {
                                        // we are deleting chars in the header
                                        return;
                                    } else {
                                        // check if we are removing required bootstrap markup
                                        tinymce.each(selectedBlocks, function (block) {
                                            if (ed.dom.hasClass(block, 'panel-heading') || ed.dom.hasClass(block, 'panel-group') || ed.dom.hasClass(block, 'panel-body') || ed.dom.hasClass(block, 'panel') || ed.dom.hasClass(block, 'panel-collapse')) {
                                                found = true;
                                            }
                                        });
                                        if (found) {
                                            return tinymce.dom.Event.cancel(e);
                                        }
                                        return;
                                    }
                                }
                            } else {
                                // all other keys
                                if (ed.dom.hasClass(elem, 'panel-group')) {
                                    return tinymce.dom.Event.cancel(e);
                                } else if (ed.dom.hasClass(elem, 'panel-heading')) {
                                    return tinymce.dom.Event.cancel(e);
                                } else if (ed.dom.hasClass(elem, 'panel-body')) {
                                    return tinymce.dom.Event.cancel(e);
                                } else if (ed.dom.hasClass(elem, 'panel-title')) {
                                    return tinymce.dom.Event.cancel(e);
                                } else if (ed.dom.hasClass(elem, 'panel-collapse')) {
                                    return tinymce.dom.Event.cancel(e);
                                }
                            }
                        }
                    } else if (keyCode === VK.BACKSPACE || keyCode === VK.DELETE) {
                        if (selectedBlocks.length >= 1) {
                            if (ed.dom.hasClass(elem, 'panel-collapse')) {
                                tinymce.each(selectedBlocks, function (block) {
                                    if (block.nodeName === 'P' && ed.dom.hasClass(block.parentNode, 'panel-body')) {
                                        ed.dom.setHTML(block, '&nbsp;');
                                        found = true;
                                    }
                                });
                            } else if (ed.dom.hasClass(elem, 'panel-title')) {
                                tinymce.each(selectedBlocks, function (block) {
                                    var firstChild = block.firstChild;
                                    if (ed.dom.hasClass(block.parentNode, 'panel-title') && firstChild.nodeName === 'A') {
                                        ed.dom.setHTML(firstChild, '&nbsp;');
                                        found = true;
                                    }
                                });
                            } else {
                                // Avoid clear elements with transelection.
                                // If you select the paragraph before the tab and the first
                                // header you'll get the header with empty text and the paragraph
                                // untouched. Both or none.

                                parent1 = ed.dom.getParent(selectedBlocks[0], '.panel-group');
                                parent2 = ed.dom.getParent(selectedBlocks[selectedBlocks.length-1], '.panel-group');
                                if (parent1 && parent2 && parent1 === parent2) {
                                    if (selectedBlocks.length < 2) {
                                        // shift+startline/endline + canc
                                        return;
                                    }
                                    return tinymce.dom.Event.cancel(e);
                                } else if (parent1 || parent2) {
                                    // no trans selection
                                    return tinymce.dom.Event.cancel(e);
                                }

                            }
                            if (found) {
                                return tinymce.dom.Event.cancel(e);
                            }
                            return;
                        }
                    }
                });
            });

            // Register commands
            ed.addCommand('mceAccordionDelete', function() {
                // remove the whole accordion
                var selected, accordion;

                selected = ed.selection.getNode();
                accordion = ed.dom.getParent(selected, '.panel-group');
                ed.dom.remove(accordion);
            });
            ed.addCommand('mceAccordionItemDelete', function() {
                // delete the selected accordion item. If it is the last one,
                // the entire accordion will be removed
                var selected, toBeRemoved, next;

                selected = ed.selection.getNode();
                toBeRemoved = ed.dom.getParent(selected, '.panel');
                next = ed.dom.getNext(toBeRemoved, '.panel');
                if (! next && ! ed.dom.getPrev(toBeRemoved, '.panel')) {
                    toBeRemoved = ed.dom.getParent(selected, '.panel-group');
                }

                if (toBeRemoved === ed.dom.getParent(selected, '.panel-group').firstChild && next) {
                    ed.dom.addClass(next.lastChild, 'in');
                }
                ed.dom.remove(toBeRemoved);
            });
            ed.addCommand('mceAccordionItemInsert', function(ui, conf) {
                // insert another accordion, after or before the selected item
                var selected, randomString1, randomString2, context, html, accordionItem, el, after;

                after = conf.after;

                selected = ed.selection.getNode();
                accordionItem = ed.dom.getParent(selected, '.panel');
                accordionParent = ed.dom.getParent(accordionItem, '.panel-group');
                randomString1 = accordionParent.id.replace('-accordion', '');
                randomString2 = Math.floor(10000 * (Math.random() % 1)).toString();
                context = {};
                context.header = defaultAccordionItem.header;
                context.body = defaultAccordionItem.body;
                context.random1 = randomString1;
                context.random2 = randomString2;
                context.collapsable = ed.dom.hasClass(accordionParent, 'sweet-collapsable');
                html = accordionItemTemplate(context);
                el = ed.dom.create('div');
                if (after) {
                    ed.dom.insertAfter(el, accordionItem);
                } else {
                    accordionParent.insertBefore(el, accordionItem);
                }
                ed.dom.setOuterHTML(el, html);

                if (!after && ed.dom.hasClass(accordionItem.lastChild, 'in')) {
                    // if the current accordion item is the first one and we are
                    // prepending another accordion item, we need to toggle the
                    // "in" class
                    ed.dom.removeClass(accordionItem.lastChild, 'in');
                    ed.dom.addClass(accordionParent.firstChild.lastChild, 'in');
                }
            });

            // Handle node change updates
/*
            ed.onNodeChange.add(function(ed, cm, n) {
                // disable toolbar's buttons depending on the current selection
                tinymce.each(buttons, function (item) {
                    cm.setDisabled(item[0], !item[2](ed, n));
                });
            });
*/

            ed.addCommand('mceAccordion', function(ui, conf) {
                // add accordion
                var selected, selectedContent, content,
                    template,
                    context, html, index, iter,
                    itemsLength = conf ? conf.itemsLength : undefined,
                    collapsable = conf ? conf.collapsable : undefined,
                    randomString1 = Math.floor(10000 * (Math.random() % 1)).toString(),
                    randomString2 = Math.floor(10000 * (Math.random() % 1)).toString();
                context = {
                    items: [],
                    collapsable: collapsable,
                    random1: randomString1,
                    random2: randomString2
                };

                selected = ed.selection.getNode();
                selectedContent = ed.selection.getContent();

                if (conf.node || selectedContent) {
                    // There is a selected content OR a node passed by the initialization popup
                    if (! conf.node) {
                        // There is no node in conf, let's open the popup and choose if we
                        // want to create an accordion or collapsable elem
                        ed.windowManager.open({
                            file : url + '/dialog.html',
                            width : 430 + parseInt(ed.getLang('media.delta_width', 0)),
                            height : 500 + parseInt(ed.getLang('media.delta_height', 0)),
                            inline : 1
                            }, {
                            node : selected,
                            plugin_url : url
                        });
                        return;
                    } else {
                        // There is a node in conf passed by the popup, let's proceed
                        selected = conf.node;
                    }

                    if (['p', 'table', 'b', 'a', 'br'].indexOf(selected.nodeName) !== -1) {
                        /* The initialization based on text selection only makes
                           sense for simple markup like the following:
                               <p>header1</p>
                               <p>body1</p>
                               <p>header2</p>
                               <p>body2</p>

                           Not like:
                               <p>header1<br />body1<br />header2<br />body2</p>
                        */
                        return;
                    }
                    tinymce.each(ed.selection.getSelectedBlocks(), function(child, index) {
                        var text = child.textContent,
                            odd = index % 2 === 0,
                            contextItemsLength = context.items.length,
                            lastItemIndex = contextItemsLength ? contextItemsLength - 1 : 0;
                        if (odd) {
                            // we use the header template
                            context.items.push({
                                header: text ? text : 'Header'
                            });
                        } else {
                            // we use the body template
                            if (!context.items[lastItemIndex].body) {
                                context.items[lastItemIndex].body = child.outerHTML;
                            }
                        }
                    });
                } else {
                    // no selection
                    if (itemsLength !== undefined) {
                        for (iter=1; iter<=itemsLength; iter++) {
                            context.items.push({header: 'Header 1', body: '<p>Body ' + iter + '</p>'});
                        }
                    } else {
                        ed.windowManager.open({
                            file : url + '/dialog.html',
                            width : 430 + parseInt(ed.getLang('media.delta_width', 0)),
                            height : 500 + parseInt(ed.getLang('media.delta_height', 0)),
                            inline : 1
                            }, {
                            plugin_url : url
                           });
                    }

                }
                if (context.items.length) {
                    html = accordionTemplate(context);
                    ed.execCommand('mceInsertContent', false, html);
                }
            });

            // Register buttons
            tinymce.each(buttons, function (item){
                ed.addButton(item[0], item[1]);
            });

        },

        getInfo: function() {
            return {
                longname: 'Accordion Plugin',
                author: 'Davide Moro (@ Abstract srl for EEA)',
                authorurl: 'http://davidemoro.blogspot.it/',
                infourl: 'https://github.com/collective/collective.sweeteditor',
                version: version
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('accordion', tinymce.plugins.AccordionPlugin);
})();