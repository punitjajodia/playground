var WATERFALL;

var FLT_MAX = 3.402823466e+38,
	FLT_MIN = 1.175494351e-38;

(function (WATERFALL) {
	var Grid = (function(){
		function Grid(){
			this.mNumParticles = 0;
	        this.mNumCells = 0;
	        this.mNumCellsX = 0;
	        this.mNumCellsY = 0;
	        this.mNumCellsZ = 0;
	        this.mNumCellsYZ = 0;
	        this.mInvSmoothingLength = 0;
	        this.mCells = new Array();

	        this.mMinX = FLT_MAX;
			this.mMinY = FLT_MAX;
			this.mMinZ = FLT_MAX;
			this.mMaxX = FLT_MIN;
			this.mMaxY = FLT_MIN;
			this.mMaxZ = FLT_MIN;
		}

		Grid.prototype.redistributeGrid = function(particles, invSmoothingLength) {
		    this.mCells.length = 0;
		    this.mInvSmoothingLength = invSmoothingLength;

			this.setBounds(particles);
			this.mNumParticles = particles.length;
			this.mNumCellsX = parseInt((this.mMaxX - this.mMinX + 1));
		    this.mNumCellsY = parseInt((this.mMaxY - this.mMinY + 1));
		    this.mNumCellsZ = parseInt((this.mMaxZ - this.mMinZ + 1));
		    this.mNumCellsYZ = parseInt(this.mNumCellsY * this.mNumCellsZ);
		    this.mNumCells = parseInt(this.mNumCellsX * this.mNumCellsYZ);

    		for(var i = 0; i < particles.length; i++ ){
    			var particle = particles[i];

    			if( typeof particle != 'undefined' && particle != null){
    				var pos = new THREE.Vector3(1,1,1).multiply(particles[i].mPosition).multiplyScalar(invSmoothingLength);

			        var cellIndex = this.getIndex(pos);

			        if(cellIndex == -1)
			        	return;

					var successor = this.mCells[cellIndex];
					//if(cell == null || typeof cell == 'undefined') {
			            //this.mCells[cellIndex] = cell = new Array();
		            this.mCells[cellIndex] = particle;
			        //}
			        this.mCells[cellIndex].mSucc = successor;
			        //cell.push(particle);
    			}
    		}
		};

		Grid.prototype.getStartIndex = function(){
			return this.getIndex(new THREE.Vector3(this.mMinX, this.mMinY, this.mMinZ));
		}

		Grid.prototype.getEndIndex = function(){
			return this.getIndex(new THREE.Vector3(this.mMaxX, this.mMaxY, this.mMaxZ));

		}

		Grid.prototype.getIndex = function(pos){
			var cellIndexX = parseInt((pos.x - this.mMinX));
	        if(cellIndexX < 0 || cellIndexX > this.mNumCellsX)
	        	return -1;
	        var cellIndexY = parseInt((pos.y - this.mMinY));
	        if(cellIndexY < 0 || cellIndexY > this.mNumCellsY)
	        	return -1;
	        var cellIndexZ = parseInt((pos.z - this.mMinZ));
	        if(cellIndexZ < 0 || cellIndexZ > this.mNumCellsZ)
	        	return -1;

			return Math.floor(cellIndexX * this.mNumCellsYZ + 
	        	cellIndexY * this.mNumCellsZ +
	        	cellIndexZ );
		}

		Grid.prototype.setBounds = function(particles){

			this.mMinX = this.mMinY = this.mMinZ = FLT_MAX;
		    this.mMaxX = this.mMaxY = this.mMaxZ = FLT_MIN;    
		    for (var i = 0; i < particles.length; i++)
		    {
		        var pos = new THREE.Vector3(1,1,1).multiply(particles[i].mPosition).multiplyScalar(this.mInvSmoothingLength);

		        if(pos.x < this.mMinX)
		            this.mMinX = pos.x;
		        if(pos.y < this.mMinY)
		            this.mMinY = pos.y;
		        if(pos.z < this.mMinZ)
		            this.mMinZ = pos.z;
		        if(pos.x > this.mMaxX)
		            this.mMaxX = pos.x;
		        if(pos.y > this.mMaxY)
		            this.mMaxY = pos.y;
		        if(pos.z > this.mMaxZ)
		            this.mMaxZ = pos.z;
		    }
		}

		return Grid;
	})();
	WATERFALL.Grid = Grid;
})(WATERFALL || (WATERFALL = {}));