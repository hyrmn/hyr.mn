---
title: AngularJS Controller on Directive
date: 2013-09-15
description: >-
  How to specify a dependencies for a controller inside a directive in AngularJS
---

A directive in AngularJS is a great way to encapsulate a bit of behavior. However, a bit of it isn't all that well-documented... how to specify a controller in a way that won't break minification.

Here's how. Easy in retrospect, but a bit different than how you might specify dependencies for the link function.

```javascript
angular.module('revenueAccounts.revAcctEditor', [])
  .directive('revAcctEditor', [function() {

    return {
      restrict: 'E',
      templateUrl: 'revenueAccounts/revAcctEditor.html',
      replace: false,
      scope: {
        revAcct: '=',
        onSave: '&',
      },
      controller: ['$scope', function($scope) {
        $scope.save = function() {
          $scope.onSave({ revAcct: $scope.revAcct });
          $scope.editForm.$setPristine();
        };
      }]
    };
  }]);
```
