var UNIFORMS = (function(){
    var FLUID = {};
    FLUID.mSmoothingLength = 15.2;
    FLUID.mSmoothingLength_2 = Math.pow(FLUID.mSmoothingLength, 2.0);

    FLUID.mRestDensity = 998.2;   //rho0
    FLUID.mMass = 10.18; //m
    FLUID.mViscosityConstant = 10;    // mew
    FLUID.mGasConstant = 1000.0; //k
    FLUID.mDiffuseConstant = 4.0;   //c
    FLUID.mSurfaceTensionCoefficient = 72.75 * 0.07; //sigma
    FLUID.mSurfaceTensionThreshold = 0.008;    //beta
    FLUID.mRestitutionCoefficient = 0.2;
    FLUID.mSurfaceColorCoefficient = 1.0;   //cs
    FLUID.mVelocityCorrectionFactor = 0.005;   //eta
    FLUID.mBulkViscosity = 5.0;
    FLUID.mSoundSpeed = 1481.0;


    // Kernel FLUID
    FLUID.mWeightPoly = (315.0 / (64.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightPolyGradient = (-945.0 / (32.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightPolyLaplacian = (-945.0 / (32.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightSpikyGradient = (-45.0 / (Math.PI * Math.pow(FLUID.mSmoothingLength, 6)));
    FLUID.mWeightViscosityLaplacian = (45.0 / (Math.PI * Math.pow(FLUID.mSmoothingLength, 6)));


    var constants = {};
    constants.time = { type: "f", value: 1.0 };
    constants.timeStep = { type: "f", value: 0.3 };
    constants.resolution = { type: "v2", value: new THREE.Vector2(WIDTH, WIDTH) };
    constants.mGravity = {type:"v3", value: new THREE.Vector3(0, -9.8 * 0.07, 0)};
    constants.emitter = {
        type: "v3", value: new THREE.Vector3(-50, 25, 25)
    };

    var _onlyFluidUniforms = function(){
        var fluidUniforms = {};
        for(var i in FLUID){
            fluidUniforms[i] = {
                type : "f",
                value : FLUID[i]
            }
        }    
    };

    var _onlyConstants = function() {
        return constants;
    }

      /**
     * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
     * @param obj1
     * @param obj2
     * @returns obj3 a new object based on obj1 and obj2
     */
    function _mergeUniforms(obj1,obj2){
        var obj3 = {};
        for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
        for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
        return obj3;
    }


    var _fluidUniforms = function() {
        return mergeUniforms(constants, _onlyFluidUniforms());
    }


    return {
        fluidUniforms : _fluidUniforms,
        constants : _onlyConstants, 
        merge : _mergeUniforms
    };

}());

