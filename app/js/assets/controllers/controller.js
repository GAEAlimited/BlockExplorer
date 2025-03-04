let assetsController = function ($http, $scope) {
    $scope.lastUpdated = moment(new Date().getTime()).format('LTS');
    $scope.addressData = {};
    $scope.allBalances = [];
    $scope.verifiedAssets = {};
    $scope.assetsTab = true;
    $scope.allAssets = [];
    $scope.loading = true;


    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.endPage = Math.ceil($scope.allAssets.length / $scope.pageSize);
    $scope.shownRows = 10;


    $scope.nextPage = function () {
        if ($scope.currentPage !== $scope.allAssets - 1) {
            $scope.$eval(function () {
                $scope.currentPage = $scope.currentPage + 1;
            });
        }
        if (($scope.currentPage + 1) * $scope.pageSize > $scope.allAssets.length) {
            $scope.$eval(function () {
                $scope.shownRows = $scope.allAssets.length;
            });
        } else {
            $scope.$eval(function () {
                $scope.shownRows = ($scope.currentPage + 1) * $scope.pageSize;
            });
        }
    };

    $scope.firstPage = function () {
        $scope.$eval(function () {
            $scope.currentPage = 0;
        });
        if (($scope.currentPage + 1) * $scope.pageSize > $scope.allAssets.length) {
            $scope.$eval(function () {
                $scope.shownRows = $scope.allAssets.length;
            });
        } else {
            $scope.$eval(function () {
                $scope.shownRows = ($scope.currentPage + 1) * $scope.pageSize;
            });
        }
    };

    $scope.lastPage = function () {
        $scope.$eval(function () {
            $scope.currentPage = $scope.endPage - 1;
        });
        if (($scope.currentPage + 1) * $scope.pageSize > $scope.allAssets.length) {
            $scope.$eval(function () {
                $scope.shownRows = $scope.allAssets.length;
            });
        } else {
            $scope.$eval(function () {
                $scope.shownRows = ($scope.currentPage + 1) * $scope.pageSize;
            });
        }
    };

    $scope.previousPage = function () {
        if ($scope.currentPage !== 0) {
            $scope.$eval(function () {
                $scope.currentPage = $scope.currentPage - 1;
            });
        }
        if (($scope.currentPage + 1) * $scope.pageSize > $scope.allAssets.length) {
            $scope.$eval(function () {
                $scope.shownRows = $scope.allAssets.length;
            });
        } else {
            $scope.$eval(function () {
                $scope.shownRows = ($scope.currentPage + 1) * $scope.pageSize;
            });
        }
    };


    $scope.countDecimals = function (decimals) {
        let returnDecimals = '1';
        for (let i = 0; i < decimals; i++) {
            returnDecimals += '0';
        }
        return parseInt(returnDecimals);
    };
    let saveAssets = [];

    $scope.getTrueTotalSupply = async (index, asset_id) => {
        await window.web3.fsn.getAsset(asset_id).then(function (r) {
            let amount = new BigNumber(r.Total.toString());
            let formattedBalance = amount.div($scope.countDecimals(r.Decimals.toString()));
            saveAssets[index].quantity = window.numeral(formattedBalance.toString()).format('0.00a');
            $scope.$apply();
        });
    }

    $scope.getAssets = async () => {
        $scope.loading = true;
        saveAssets = [];
        let allAssets = 0;
        $http.get(`${window.getServer()}assets/verified`).then(function (r) {
            $scope.verifiedAssets = r.data;
        });
        await $http.get(`${window.getServer()}fsnprice`).then(function (r) {
            allAssets = Math.ceil(r.data.totalAssets / 100);
            for (let i = 0; i < allAssets; i++) {
                let assets = {};
                $http.get(`${window.getServer()}assets/all?page=${i}&size=100&sort=desc`).then(function (r) {
                    assets = r.data;
                    console.log(assets);
                    for (let asset in assets) {
                        let verifiedImage = '';
                        let hasImage = false;
                        let verifiedAsset = false;
                        for (let a in $scope.verifiedAssets) {
                            if (assets[asset].commandExtra == $scope.verifiedAssets[a].assetID) {
                                // Set matched image name
                                verifiedImage = $scope.verifiedAssets[a].image;
                                hasImage = true;
                                verifiedAsset = true;
                            }
                        }
                        $http.get(`${window.getServer()}assets/${assets[asset].commandExtra}`).then(function (r) {
                            if (assets[asset].commandExtra == '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') {
                                let data = {
                                    assetName: 'FUSION (FSN)',
                                    assetSymbol: 'FSN',
                                    assetId: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                                    assetType: 'FUSION',
                                    // quantity: formattedBalance.toString(),
                                    verified: true,
                                    hasImage: true,
                                    verifiedImage: 'EFSN_LIGHT.svg'
                                };
                                saveAssets.push(data);
                                return;
                            } else {
                                let assetData = r.data[0];
                                let assetExtraData = JSON.parse(r.data[0].data);
                                let amount = new BigNumber(assetExtraData.Total.toString());
                                let formattedBalance = amount.div($scope.countDecimals(assetExtraData.Decimals.toString()));
                                let data = {
                                    assetName: assetData.commandExtra2,
                                    assetSymbol: assetExtraData.Symbol.substr(0, 4),
                                    assetId: assetExtraData.AssetID,
                                    assetType: 'FUSION',
                                    quantity: window.numeral(formattedBalance.toString()).format('0.00a'),
                                    verified: verifiedAsset,
                                    hasImage: hasImage,
                                    verifiedImage: verifiedImage
                                };
                                if (verifiedAsset) {
                                    $scope.getTrueTotalSupply(asset, assetExtraData.AssetID);
                                }
                                saveAssets[asset] = data;
                                $scope.allAssets = saveAssets;
                                $scope.endPage = Math.ceil(saveAssets.length / $scope.pageSize);
                            }
                        });
                    }
                });
            }
        });
        $scope.$eval(function () {
            $scope.allAssets = saveAssets;
            $scope.loading = false;
        });
    };

    $scope.getAssets().then(function () {
        $scope.$apply();
    });
};

export default assetsController;
