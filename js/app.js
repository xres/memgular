'use strict';

var game = angular.module('MemoryGame', []);

game.factory('gameData', [function() {
    var data = {
        user: {
            name: '',
            signedIn: false,
            remainingPairs: 0,
            guesses: 0
        },

        deck: [],

        friends: [],

        reset: function() {
            data.deck.length = 0;
            data.user.remainingPairs = 0;
            data.user.guesses = 0;
        },

        signIn: function(name) {
            data.user.name = name;
            data.user.signedIn = true;
        },

        signOut: function() {
            data.user.name = '';
            data.user.signedIn = false;
            data.friends.length = 0;
            data.reset();
        }
    }

    return data;
}]);

game.controller('AppController', ['$scope', 'gameData',
    function($scope, gameData) {

        var firstCard,
            secondCard;

        $scope.game = gameData;
        $scope.connectionsLoaded = false;

        var shuffle = function(friends) {
            var i = Math.floor(Math.random() * friends.length);
            return friends.splice(i, 1)[0];
        };

        var flipCard = function(card) {
            card.isFlipped = !card.isFlipped;
        }

        $scope.getProfile = function() {
            IN.API.Profile("me")
                .fields(['id', 'firstName', 'lastName', 'pictureUrl'])
                .result(function(result) {
                    $scope.$apply(function() {
                        gameData.signIn(result.values[0].firstName + ' ' + result.values[0].lastName);
                    });
                });
        };

        $scope.getConnections = function() {
            IN.API.Connections("me")
                .fields(['id', 'firstName', 'lastName', 'pictureUrl'])
                .result(function(result) {
                    $scope.$apply(function() {
                        gameData.friends = result.values;
                        $scope.connectionsLoaded = true;
                        $scope.newGame();
                    });
                });
        };

        $scope.signOut = function() {
            IN.User.logout();
            gameData.signOut();
        };

        $scope.newGame = function() {
            var cardPairs = 20,
                friends = gameData.friends.slice(),
                deck = [],
                card;

            gameData.reset();
            gameData.user.remainingPairs = cardPairs;

            for (var i = 0; i < cardPairs; i++) {
                card = shuffle(friends);

                // Filter out private profiles
                if (card.id === 'private') {
                    i--;
                }
                else {
                    deck.push({
                        'id': card.id,
                        'name': card.firstName + ' ' + card.lastName,
                        'pictureUrl': card.pictureUrl,
                        'isFlipped': false
                    });

                    deck.push({
                        'id': card.id,
                        'name': card.firstName + ' ' + card.lastName,
                        'pictureUrl': '',
                        'isFlipped': false
                    });
                }
            }

            for (var i = 0; i < cardPairs * 2; i++) {
                gameData.deck.push(shuffle(deck));
            };
        };

        $scope.flip = function(card) {
            if (!card.isFlipped) {
                flipCard(card);

                if (angular.isDefined(secondCard)) {
                    flipCard(firstCard);
                    flipCard(secondCard);
                    firstCard = secondCard = undefined;
                    firstCard = card;
                }
                else if (angular.isDefined(firstCard)) {
                    if (firstCard.id === card.id) {
                        gameData.user.remainingPairs--;
                        firstCard = secondCard = undefined;
                    }
                    else {
                        secondCard = card;
                        gameData.user.guesses++;
                    }
                }
                else {
                    firstCard = card;
                };

            };
        };

    }
]);

function initLinkedIn() {
    IN.Event.on(IN, "auth", function() {
        angular.element(document.getElementById('app-container'))
            .scope()
            .$apply(
                function($scope) {
                    $scope.getProfile();
                    $scope.getConnections();
                }
        );
    });
};
