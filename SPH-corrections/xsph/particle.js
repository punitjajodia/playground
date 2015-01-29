var WATERFALL;

(function (WATERFALL) {
	var Particle = (function(){
		function Particle(x, y, z, restDensity, index){

            this.mIndex = index;

            // Vectors
            this.mAcceleration = new THREE.Vector3(0, 0, 0);
            this.mVelocity = new THREE.Vector3(0, -0.5, 0);
		    this.mPosition = new THREE.Vector3(x, y, z);
		    this.mForce = new THREE.Vector3(0, 0, 0);
		    this.mVelocityCorrection = new THREE.Vector3(0, 0, 0);

            //this.mLastAcceleration = this.mAcceleration;
            //this.mLastVelocity = this.mVelocity;
		    //this.mLastPosition = this.mPosition;
		    
			
            // Floats
			this.mPressure = 0;
		    this.mSurfaceTension = 0;
			this.mDensity = restDensity;
		}

	    Particle.prototype.reset = function() {
	        this.mForce = new THREE.Vector3(0, 0, 0);
	    };

		return Particle;
	})();
	WATERFALL.Particle = Particle;
})(WATERFALL || (WATERFALL = {}));