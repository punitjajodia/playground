var WATERFALL;

(function(WATERFALL) {
    var vec3LengthSquare = function(vector) {
        return Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2);
    };

    var newVec = function() {
        return new THREE.Vector3(1, 1, 1);
    };

    var test = function(vec3, tag) {
        if (isNaN(vec3.x) || isNaN(vec3.y) || isNaN(vec3.z)) {
            console.log(tag);
            console.log(vec3);
        }
    };

    var testNumber = function(num, tag) {
        if (isNaN(num))
            console.log(tag);
    };

    var randomNumber = function (min, max) {
        if (min == max) {
            return (min);
        }

        var random = Math.random();

        return ((random * (max - min)) + min);
    };

    var SPH = (function() {
        function SPH(numX, numY, numZ, options) {

            // Global system paramters
            this.mUnitScale = 0.07;
            this.mGravity = options.gravity || new THREE.Vector3(0, -9.80 * this.mUnitScale, 0);  //g
            this.mTimeStep = options.timeStep || 0.2;   //dt
            this.mXlimit = 40;
            this.mXlimitNeg = 0;
            this.mYlimit = 20;
            this.mYlimitNeg = -40;
            this.mZlimit = 20;
            this.mZlimitNeg = 0;

            // Global SPH parameters
            this.mRestDensity = options.restDensity || 40 * this.mUnitScale;   //rho0
            this.mMass = options.mass || 0.18; //m
            this.mViscosityConstant = options.viscosityConstant || 0.894;    // mew
            this.mGasConstant = options.gasConstant || 10; //k
            this.mDiffuseConstant = options.diffuseConstant || 40.0;   //c
            this.mSmoothingLength = options.smoothingLength || 1.05;    //h or l
            this.mSurfaceTensionCoefficient = options.surfaceTensionCoefficient || 1.3; //sigma
            this.mSurfaceTensionThreshold = options.surfaceTensionThreshold || 0.0008;    //beta
            this.mRestitutionCoefficient = options.restitutionCoefficient || 0.4;
            this.mSurfaceColorCoefficient = options.surfaceColorCoefficient || 2.0;   //cs
            this.mVelocityCorrectionFactor = options.velocityCorrectionFactor || 0.05;   //eta

            // Kernel constants
            this.mWeightPoly = (315.0 / (64.0 * Math.PI * Math.pow(this.mSmoothingLength, 9)));
            this.mWeightPolyGradient = (-945.0 / (32.0 * Math.PI * Math.pow(this.mSmoothingLength, 9)));
            this.mWeightPolyLaplacian = (-945.0 / (32.0 * Math.PI * Math.pow(this.mSmoothingLength, 9)));
            this.mWeightSpikyGradient = (-45.0 / (Math.PI * Math.pow(this.mSmoothingLength, 6)));
            this.mWeightViscosityLaplacian = (45.0 / (Math.PI * Math.pow(this.mSmoothingLength, 6)));

            this.mParticles = new Array();
            this.mGeometry = new THREE.Geometry();
            this.mNeighborList = new WATERFALL.Neighbor(numX * numY * numZ, this.mSmoothingLength);

            this.injectParticles(numX, numY, numZ);
         //   this.injectStationaryParticles(numX, numY, numZ);

            this.mGeometry.dynamic = true;
        };

        SPH.prototype.wKernelPoly = function(separationLength) {
            if(separationLength > this.mSmoothingLength || separationLength <= 0)
                return 0;
            return this.mWeightPoly * Math.pow(Math.pow(this.mSmoothingLength, 2) - Math.pow(separationLength, 2), 3);
        };

        SPH.prototype.wKernelPolyGradient = function(separationVector) {
            var separationLength = separationVector.length(); //Check length function
            if(separationLength > this.mSmoothingLength || separationLength <= 0)
                return new THREE.Vector3(0,0,0);
            return newVec().multiply(separationVector).multiplyScalar(this.mWeightPolyGradient * Math.pow(Math.pow(this.mSmoothingLength, 2) - Math.pow(separationLength, 2), 2));
        };

        SPH.prototype.wKernelPolyLaplacian = function(separationLength) {
            var smoothingLengthSq = Math.pow(this.mSmoothingLength, 2);
            if(separationLength > this.mSmoothingLength || separationLength <= 0)
                return 0;
            var separationLengthSq = Math.pow(separationLength, 2);
            return this.mWeightPolyLaplacian * (smoothingLengthSq - separationLengthSq) * (3 * smoothingLengthSq - 7 * separationLengthSq);
        };

        SPH.prototype.wKernelSpikyGradient = function(separationVector) {
            var separationLength = separationVector.length(); //Check length function
            if(separationLength > this.mSmoothingLength || separationLength <= 0)
                return new THREE.Vector3(0,0,0);
            return newVec().multiply(separationVector).normalize().multiplyScalar(this.mWeightSpikyGradient * Math.pow(this.mSmoothingLength - separationLength, 2));  //Check normalize function creates a new vector or not
        };

        SPH.prototype.wKernelViscosityLaplacian = function(separationVector) {
            var separationLength = separationVector.length(); //Check length function
            if(separationLength > this.mSmoothingLength || separationLength <= 0)
                return new THREE.Vector3(0,0,0);
            return newVec().multiply(separationVector).multiplyScalar(this.mWeightViscosityLaplacian * (this.mSmoothingLength - separationLength));
        };

        SPH.prototype.injectStationaryParticles = function(numX, numY, numZ) {
            var i = 0;
            for (var z = 0; z < numZ; z = z + 1) {
                for (var x = 0; x < numX; x = x + 1) {
                    var newX = x;
                    var newY = this.mYlimitNeg;
                    var newZ = z;
                    this.mParticles.push(this.addParticle(newX, newY, newZ, i));
                    i++;
                }
            }

            this.mNeighborList.reinitialize(this.mParticles.length, this.mSmoothingLength);
        };

        SPH.prototype.injectParticles = function(numX, numY, numZ) {
            var i = 0;
            for (var z = 0; z < numZ; z = z + 1) {
                for (var y = 0; y < numY; y = y + 1) {
                    for (var x = 0; x < numX; x = x + 1) {
                        var newX = x;
                        var newY = y;
                        var newZ = z;
                        this.mParticles.push(this.addParticle(newX, newY, newZ, i));
                        i++;
                    }
                }
            }

            this.mNeighborList.reinitialize(this.mParticles.length, this.mSmoothingLength);
        }

        SPH.prototype.addParticle = function(x, y, z, index) {

            var particle = new WATERFALL.Particle(x, y, z, this.mRestDensity, index);

            this.mGeometry.vertices.push(new THREE.Vector3(x, y, z));

            return particle;
        };

        SPH.prototype.update = function() {
            this.refreshNeighbors();
            this.calculateDensityAndPressure();
            this.calculateForces();
            this.integrate();
        };

        SPH.prototype.dispose = function() {
            this.mParticles = [];
        };

        SPH.prototype.refreshNeighbors = function() {
            this.mNeighborList.clearHashMap();
            this.mNeighborList.refreshHashMap(this.mParticles);
        };

        SPH.prototype.calculateDensityAndPressure = function() {
            for (var i = 0; i < this.mParticles.length; i++) {
                var particle = this.mParticles[i];

                //Reset the particle properties
                particle.reset();

                // var neighbors = this.mNeighborList.getNeighbors(particle.mPosition);  //Check Implement neighbors
                var neighbors =  this.mParticles;
                // Summation of m * Wpoly6(xi - xj, h)
                var density = 0;
                for (var j = 0; j < neighbors.length; j++) {
                    density += this.mMass * this.wKernelPoly(newVec().subVectors(particle.mPosition, neighbors[j].mPosition).length());//Check length function
                }
                particle.mDensity += density;

                // k(rhoi - rho0)
                particle.mPressure = this.mGasConstant * (particle.mDensity - this.mRestDensity);// * this.mUnitScale; //unit

            }
        };

        SPH.prototype.calculateForces = function() {
            for (var i = 0; i < this.mParticles.length; i++) {
                var particle = this.mParticles[i];

                // var neighbors = this.mNeighborList.getNeighbors(particle.mPosition);  //Check Implement neighbors
                var neighbors = this.mParticles;
                var massPerDensity = 0;
                var separationVector = new THREE.Vector3(0, 0, 0);
                var separationLength = 0;

                var pressure = new THREE.Vector3(0, 0, 0);
                var viscosity = new THREE.Vector3(0, 0, 0);
                var velocity = new THREE.Vector3(0, 0, 0);

                var surfaceGradient = new THREE.Vector3(0, 0, 0);
                var surfaceLaplacian = 0;
                var surfaceTensionGradient = new THREE.Vector3(0, 0, 0);
                var surfaceTensionLaplacian = 0;

                for (var j = 0; j < neighbors.length; j++) {
                    var neighbor = neighbors[j];

                    massPerDensity = this.mMass / neighbor.mDensity;
                    separationVector = newVec().subVectors(particle.mPosition, neighbor.mPosition);
                    separationLength = separationVector.length();    //Check length function    

                    if (neighbor.mIndex != particle.mIndex) {
                        pressure.add(this.wKernelSpikyGradient(separationVector).multiplyScalar(this.mMass)
                            .multiplyScalar((particle.mPressure / Math.pow(particle.mDensity, 2)) + (neighbor.mPressure / Math.pow(neighbor.mDensity, 2))));
//                        pressure.add(this.wKernelSpikyGradient(separationVector).multiplyScalar(massPerDensity)
//                            .multiplyScalar((particle.mPressure + neighbor.mPressure) /2));

                        var diffVelocity = newVec().subVectors(neighbor.mVelocity, particle.mVelocity);
                        viscosity.add(this.wKernelViscosityLaplacian(separationVector).multiplyScalar(massPerDensity)
                            .multiply(diffVelocity));

                        velocity.add(newVec().multiply(diffVelocity).multiplyScalar(this.wKernelPoly(separationLength) * 2 * this.mMass / (particle.mDensity + neighbor.mDensity)));
                    }

                    surfaceGradient = this.wKernelPolyGradient(separationVector);
                    surfaceLaplacian = this.wKernelPolyLaplacian(separationLength);

                    surfaceTensionGradient.add(surfaceGradient.multiplyScalar(massPerDensity * this.mSurfaceColorCoefficient));
                    surfaceTensionLaplacian += this.mSurfaceColorCoefficient * surfaceLaplacian * massPerDensity;
                }

                // Pressure force
                particle.mForce.add(pressure.multiplyScalar(-1/particle.mDensity));
                // Viscosity force
                particle.mForce.add(viscosity.multiplyScalar(this.mViscosityConstant));
                // Surface tension force
                if(surfaceTensionGradient.length() > this.mSurfaceTensionThreshold) //Check length function
                    particle.mForce.add(newVec().multiply(surfaceTensionGradient).normalize()
                        .multiplyScalar(surfaceTensionLaplacian * (- this.mSurfaceTensionCoefficient)));
                // Gravity force
                particle.mForce.add(newVec().multiply(this.mGravity).multiplyScalar(particle.mDensity));

                //particle.mForce.multiplyScalar(this.mUnitScale);    //unit

                // Particle velocity correction
                particle.mVelocityCorrection = velocity.multiplyScalar(this.mVelocityCorrectionFactor);

                //particle.mVelocity.multiplyScalar(this.mUnitScale); //unit

            }
        };

        SPH.prototype.integrate = function() {
            for(var i = 0; i < this.mParticles.length; i++)
            {
                var particle = this.mParticles[i];

                var lastAcceleration = newVec().multiply(particle.mAcceleration);
                var lastVelocity = newVec().multiply(particle.mVelocity);

                // Calculate acceleration
                particle.mAcceleration = newVec().multiply(particle.mForce).divideScalar(particle.mDensity);

                //particle.mAcceleration.multiplyScalar(this.mUnitScale); //unit

                // Leapfrog integration
                // ui+1 = ui + (1/2) (ai + ai+1) dt
                particle.mVelocity.add(newVec().addVectors(lastAcceleration, particle.mAcceleration).multiplyScalar(this.mTimeStep / 2));
                //particle.mVelocity.multiplyScalar(this.mUnitScale); //unit

                particle.mVelocity.add(particle.mVelocityCorrection);

                // xi+1 = xi + ui . dt + ai . dt2 / 2
                particle.mPosition.add(newVec().multiply(particle.mVelocity).multiplyScalar(this.mTimeStep) //Current Velocity
                    .add(newVec().multiply(particle.mAcceleration).multiplyScalar(this.mTimeStep * this.mTimeStep / 2)));
                //particle.mPosition.multiplyScalar(this.mUnitScale); //unit

                // Check boundary condition
                //particle.mPosition.min(new THREE.Vector3(this.mXlimit, this.mYlimit, this.mZlimit))
                //    .max(new THREE.Vector3(this.mXlimitNeg, this.mYlimitNeg, this.mZlimitNeg));

                this.updateVelocity(particle, "x-axis");
                this.updateVelocity(particle, "y-axis");
                this.updateVelocity(particle, "z-axis");

                this.mGeometry.vertices[i] = newVec().multiply(particle.mPosition);
            }

            this.mGeometry.verticesNeedUpdate = true;
        };

        SPH.prototype.updateVelocity = function(particle, axis) {
            var minLimit = 0;
            var maxLimit = 0;
            switch (axis) {
            case "x-axis":
                particle.mPosition.x = Math.max(Math.min(particle.mPosition.x, this.mXlimit), this.mXlimitNeg);
                minLimit = this.mXlimitNeg - particle.mPosition.x;
                maxLimit = this.mXlimit - particle.mPosition.x;
                if (minLimit == 0 || maxLimit == 0)
                    particle.mVelocity.x *= -this.mRestitutionCoefficient;
                break;
            case "y-axis":
                particle.mPosition.y = Math.max(Math.min(particle.mPosition.y, this.mYlimit), this.mYlimitNeg);
                minLimit = this.mYlimitNeg - particle.mPosition.y;
                maxLimit = this.mYlimit - particle.mPosition.y;
                if (minLimit == 0 || maxLimit == 0)
                    particle.mVelocity.y *= -this.mRestitutionCoefficient;
                break;
            case "z-axis":
                particle.mPosition.z = Math.max(Math.min(particle.mPosition.z, this.mZlimit), this.mZlimitNeg);
                minLimit = this.mZlimitNeg - particle.mPosition.z;
                maxLimit = this.mZlimit - particle.mPosition.z;
                if (minLimit == 0 || maxLimit == 0)
                    particle.mVelocity.z *= -this.mRestitutionCoefficient;
                break;
            default:
            }
        };

        return SPH;
    })();
    WATERFALL.SPH = SPH;
})(WATERFALL || (WATERFALL = {}));
