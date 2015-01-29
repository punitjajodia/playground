var WATERFALL;

(function(WATERFALL) {
    var getNextPrimeNumber = function(start) {
        var i = start;

        var isPrimeNumberFound = true;
        var isNextPrimeNumberFound = false;

        //Get Square root of number and iterate, start from 2
        var check = Math.floor(Math.sqrt(i));
        for (var j = 2; j <= check; j++) {
            if (i % j == 0) {
                isPrimeNumberFound = false;
                break;
            }
        }
        if (isPrimeNumberFound) {
            //i itself is the next prime number
            return i;
        } else {
            //i is not a prime number -> must search next one

            i++;
            isPrimeNumberFound = true;

            // Increment current number to find next prime number
            while (isNextPrimeNumberFound == false) {
                check = Math.floor(Math.sqrt(i));

                for (var j = 2; j <= check; j++) {
                    if (i % j == 0) {
                        isPrimeNumberFound = false;
                        break;
                    }
                }

                if (isPrimeNumberFound)
                    isNextPrimeNumberFound = true;
                else {
                    i++;
                    isPrimeNumberFound = true;
                }
            }

            if (isNextPrimeNumberFound) {
                //i is the next prime number

                return i;
            }
        }

        //eventually, nothing found?
        return start;
    };

    var modulus = function(a, b) {
        var m = a % b;
        return m < 0 ? m + b : m;
    };

    var newVec = function() {
        return new THREE.Vector3(1, 1, 1);
    };

    var Neighbor = (function() {
        function Neighbor(numParticles, smoothingLength) {
            // Define prime-numbers
            this.mPrimeNumber1 = 11113;//73856093;
            this.mPrimeNumber2 = 12979;//19349663;
            this.mPrimeNumber3 = 13513;//83492791;

            this.mCellSize = 0;
            this.mMapSize = 0;
            this.mHashMap = new HashMap();

            this.reinitialize(numParticles, smoothingLength);
        }

        Neighbor.prototype.reinitialize = function(numParticles, smoothingLength) {
            this.mCellSize = smoothingLength;
            this.mMapSize = getNextPrimeNumber(numParticles);
        };

        Neighbor.prototype.clearHashMap = function() {
            this.mHashMap.clear();
        };

        Neighbor.prototype.refreshHashMap = function(particles) {
            for (var i = 0; i < particles.length; i++) {
                var hashKey = this.hashPosition(particles[i].mPosition);

                this.mHashMap.set(hashKey, particles[i]);
            }
        }

        Neighbor.prototype.discretizePosition = function(position) {
            return newVec().multiply(position).divideScalar(this.mCellSize).floor();
        };

        Neighbor.prototype.hashPosition = function(position) {
            var discretePosition = this.discretizePosition(position);

            var key = modulus(((discretePosition.x * this.mPrimeNumber1) ^ (discretePosition.y * this.mPrimeNumber2) ^ (discretePosition.z * this.mPrimeNumber3)), this.mMapSize);

            return key;
        };

        Neighbor.prototype.isParticleIncluded = function(particleIndex, neighborList) {
            for (var i = 0; i < neighborList.length; i++) {
                var neighbor = neighborList[i];
                if (neighbor.mIndex == particleIndex)
                    return true;
            }

            return false;
        }

        Neighbor.prototype.getCellNeighbors = function(centerPosition, checkWithinSmoothingLength, neighborList) {
            var hashKey = this.hashPosition(centerPosition);

            var candidateList = this.mHashMap.get(hashKey);
            for (var i = 0; i < candidateList.length; i++) {
                var candidate = candidateList[i];
                if (!this.isParticleIncluded(candidate.mIndex, neighborList)) {
                    if (checkWithinSmoothingLength) {
                        var distance = newVec().subVectors(centerPosition, candidate.mPosition).length();

                        if (distance > this.mCellSize || distance < 0.00003)
                            continue;
                    }
                    neighborList.push(candidate);
                }
            }
        };

        Neighbor.prototype.getNeighbors = function(centerPosition) {
            var neighborList = new Array();
            var neighborTempList = new Array();

            // Get direct hash neighbors, no check required
            this.getCellNeighbors(centerPosition, false, neighborTempList);

            // Bounding box search
            var limit = new THREE.Vector3(this.mCellSize, this.mCellSize, this.mCellSize);
            var discreteMinBounds = this.discretizePosition(newVec().subVectors(centerPosition, limit));
            var discreteMaxBounds = this.discretizePosition(newVec().addVectors(centerPosition, limit));

            // Bound loop
            var sampleStep = 0.85;
            for (var x = discreteMinBounds.x; x < discreteMaxBounds.x; x += sampleStep)
            {
                for (var y = discreteMinBounds.y; y < discreteMaxBounds.y; y += sampleStep)
                {
                    for (var z = discreteMinBounds.z; z < discreteMaxBounds.z; z += sampleStep)
                    {
                        this.getCellNeighbors(new THREE.Vector3(x, y, z), true, neighborTempList);
                    }
                }
            }

            for (var i = 0; i < neighborTempList.length; i++) {
                var distance = newVec().subVectors(centerPosition, neighborTempList[i].mPosition).length();

                if (distance < this.mCellSize && distance > 0.00003)
                    neighborList.push(neighborTempList[i]);
            }

            return neighborList;
        };

        return Neighbor;
    })();
    WATERFALL.Neighbor = Neighbor;
})(WATERFALL || (WATERFALL = {}));