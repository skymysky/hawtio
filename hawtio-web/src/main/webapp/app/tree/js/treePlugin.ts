module Tree {
  var pluginName = 'tree';
  angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtioCore']).
          directive('hawtioTree',function (workspace, $timeout, $filter, $compile) {
            // return the directive link function. (compile function not needed)
            return function (scope, element, attrs) {
              var tree = null;
              var data = null;
              var widget = null;
              var timeoutId = null;
              var onSelectFn = null;
              var onSelectFnName = attrs.onselect;
              if (onSelectFnName) {
                onSelectFn = Core.pathGet(scope, onSelectFnName);
                if (!angular.isFunction(onSelectFn)) {
                  onSelectFn = null;
                }
              }

              // watch the expression, and update the UI on change.
              var data = attrs.hawtioTree;
              var queryParam = data;

              scope.$watch(data, onWidgetDataChange);

              // lets add a separate event so we can force updates
              // if we find cases where the delta logic doesn't work
              scope.$on("hawtio.tree." + data, function (args) {
                var value = Core.pathGet(scope, data);
                onWidgetDataChange(value);
              });

              // listen on DOM destroy (removal) event, and cancel the next UI update
              // to prevent updating ofter the DOM element was removed.
              element.bind('$destroy', function () {
                $timeout.cancel(timeoutId);
              });

              updateLater(); // kick off the UI update process.

              // used to update the UI
              function updateWidget() {
                // console.log("updating the grid!!");
                Core.$applyNowOrLater(scope);
              }

              function onWidgetDataChange(value) {
                tree = value;
                if (tree) {
                  // lets find a child table element
                  // or lets add one if there's not one already
                  var treeElement = $(element);
                  var children = Core.asArray(tree);
                  var hideRoot = attrs["hideroot"];
                  if ("true" === hideRoot) {
                    children = tree.children;
                  }
                  widget = treeElement.dynatree({
                    /**
                     * The event handler called when a different node in the tree is selected
                     */
                    onActivate: function (node:DynaTreeNode) {
                      var data = node.data;
                      if (onSelectFn) {
                        onSelectFn(data);
                      } else {
                        workspace.updateSelectionNode(data);
                      }
                      Core.$apply(scope);
                    },
                    /*
                     onLazyRead: function(treeNode) {
                     var folder = treeNode.data;
                     var plugin = null;
                     if (folder) {
                     plugin = Jmx.findLazyLoadingFunction(workspace, folder);
                     }
                     if (plugin) {
                     console.log("Lazy loading folder " + folder.title);
                     var oldChildren = folder.childen;
                     plugin(workspace, folder, () => {
                     treeNode.setLazyNodeStatus(DTNodeStatus_Ok);
                     var newChildren = folder.children;
                     if (newChildren !== oldChildren) {
                     treeNode.removeChildren();
                     angular.forEach(newChildren, newChild => {
                     treeNode.addChild(newChild);
                     });
                     }
                     });
                     } else {
                     treeNode.setLazyNodeStatus(DTNodeStatus_Ok);
                     }
                     },
                     */
                    onClick: function (node:DynaTreeNode, event:Event) {
                      if (event["metaKey"]) {
                        event.preventDefault();
                        var url = $location.absUrl();
                        if (node && node.data) {
                          var key = node.data["key"];
                          if (key) {
                            var hash = $location.search();
                            hash[queryParam] = key;

                            // TODO this could maybe be a generic helper function?
                            // lets trim after the ?
                            var idx = url.indexOf('?');
                            if (idx <= 0) {
                              url += "?";
                            } else {
                              url = url.substring(0, idx + 1);
                            }
                            url += $.param(hash);
                          }
                        }
                        window.open(url, '_blank');
                        window.focus();
                        return false;
                      }
                      return true;
                    },
                    persist: false,
                    debugLevel: 0,
                    children: children
                  });

                  /*
                   if (redraw) {
                   workspace.redrawTree();
                   }
                   */
                }
                updateWidget();
              }

              // schedule update in one second
              function updateLater() {
                // save the timeoutId for canceling
                timeoutId = $timeout(function () {
                  updateWidget(); // update DOM
                }, 300);
              }
            }
          }).
          run(function (helpRegistry) {
            helpRegistry.addDevDoc(pluginName, 'app/tree/doc/developer.md');
          });

  hawtioPluginLoader.addModule(pluginName);
}
