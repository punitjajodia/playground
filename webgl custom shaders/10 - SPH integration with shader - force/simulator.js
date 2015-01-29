/*
 * @author github.com/zz85 | twitter.com/blurspline
 */
// SimulationShader



var FLUID = {};
	FLUID.mSmoothingLength = 2.0;
	FLUID.mSmoothingLength_2 = Math.pow(FLUID.mSmoothingLength, 2.0);

	FLUID.mRestDensity = 40.0 * 0.07;   //rho0
    FLUID.mMass = 0.18; //m
    FLUID.mViscosityConstant = 0.894;    // mew
    FLUID.mGasConstant = 10.0; //k
    FLUID.mDiffuseConstant = 4.0;   //c
    FLUID.mSurfaceTensionCoefficient = 10.3; //sigma
    FLUID.mSurfaceTensionThreshold = 0.008;    //beta
    FLUID.mRestitutionCoefficient = 0.9;
    FLUID.mSurfaceColorCoefficient = 5.0;   //cs
    FLUID.mVelocityCorrectionFactor = 0.005;   //eta


    // Kernel FLUID
    FLUID.mWeightPoly = (315.0 / (64.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightPolyGradient = (-945.0 / (32.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightPolyLaplacian = (-945.0 / (32.0 * Math.PI * Math.pow(FLUID.mSmoothingLength, 9)));
    FLUID.mWeightSpikyGradient = (-45.0 / (Math.PI * Math.pow(FLUID.mSmoothingLength, 6)));
    FLUID.mWeightViscosityLaplacian = (45.0 / (Math.PI * Math.pow(FLUID.mSmoothingLength, 6)));

function SimulatorRenderer(WIDTH, renderer) {
	// webgl renderer
	WIDTH = WIDTH || 4;
	var camera = new THREE.Camera();
	camera.position.z = 1;


	// Init RTT stuff
	gl = renderer.getContext();

	if( !gl.getExtension( "OES_texture_float" )) {
		alert( "No OES_texture_float support for float textures!" );
		return;
	}

	if( gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0) {
		alert( "No support for vertex shader textures!" );
		return;	
	}


	var scene = new THREE.Scene();


	var uniforms = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2(WIDTH, WIDTH) },
		texture: { type: "t", value: null },
		// Inputs
	};

	var material = new THREE.ShaderMaterial( {

		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent

	} );

	var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), material );


	//These constants will have to be passed to every shader 
	var constants = {};

	constants.time = { type: "f", value: 1.0 };
	constants.timeStep = { type: "f", value: 0.02 };
	constants.resolution = { type: "v2", value: new THREE.Vector2(WIDTH, WIDTH) };
	constants.mGravity = {type:"v3", value: new THREE.Vector3(0, -9.8, 0)};




	
	this.updateConfig = function() {
		 for(var i in FLUID){
    		constants[i] = {
	    		type : "f",
	    		value : FLUID[i]
    		}
    	}
	};


	this.updateConfig();
    //Since all the fluid constants are floats, we can put all of them in uniforms in one go

   

      /**
     * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
     * @param obj1
     * @param obj2
     * @returns obj3 a new object based on obj1 and obj2
     */
    function mergeUniforms(obj1,obj2){
        var obj3 = {};
        for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
        for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
        return obj3;
    }


	var positionShader = new THREE.ShaderMaterial( {

		uniforms: mergeUniforms(constants, {
			texturePosition: { type: "t", value: null },
			textureVelocity: { type: "t", value: null },
			textureDensityPressure: { type: "t", value: null },
			textureForce: { type: "t", value: null },
		}),
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderPosition' ).textContent


	} );

	var velocityShader = new THREE.ShaderMaterial( {
		uniforms: mergeUniforms(constants, {
			texturePosition: { type: "t", value: null },
			textureVelocity: { type: "t", value: null },
			textureDensityPressure: { type: "t", value: null },
			textureForce : {type : "t", value: null},
			lastTextureDensityPressure: { type: "t", value: null },
			lastTextureForce : {type : "t", value: null}
		}),
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderVelocity' ).textContent

	} );

	var densityShader = new THREE.ShaderMaterial( {
		uniforms: mergeUniforms(constants, {
			textureDensityPressure: { type: "t", value: null },
			textureVelocity: { type: "t", value: null },
			texturePosition: { type: "t", value: null },
		}),
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderDensityPressure' ).textContent
	});

	var forceShader = new THREE.ShaderMaterial( {
		uniforms: mergeUniforms(constants, {
			textureDensityPressure: { type: "t", value: null },
			textureVelocity: { type: "t", value: null },
			texturePosition: { type: "t", value: null },
		}),
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderForce' ).textContent
	});

	this.velocityUniforms = velocityShader.uniforms;

	scene.add( mesh );

	this.getRenderTarget = function() {
		var renderTarget = new THREE.WebGLRenderTarget(WIDTH, WIDTH, {
			wrapS: THREE.RepeatWrapping,
			wrapT: THREE.RepeatWrapping,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			stencilBuffer: false
		});

		return renderTarget;
	}

	// Takes a texture, and render out as another texture
	// aka. renderToTexture()

	this.renderTexture = function(input, output) {
		uniforms.texture.value = input;
		renderer.render(scene, camera, output)
		this.output = output;
	}

	this.renderDensityPressure = function(position, velocity, densityPressure, output) {
		mesh.material = densityShader;
		densityShader.uniforms.texturePosition.value = position;
		densityShader.uniforms.textureVelocity.value = velocity;
		densityShader.uniforms.textureDensityPressure.value = densityPressure;
		renderer.render(scene, camera, output);

		var buffer = new Float32Array((WIDTH + 1) * (WIDTH + 1) );

		renderer.getContext().readPixels(output.offset.x, output.offset.y, WIDTH, WIDTH, gl.RGBA, gl.FLOAT, buffer);

		// console.log(buffer);
		// debugger;

		this.output = output;
	}

	this.renderForce = function(position, velocity, densityPressure, output) {
		mesh.material = forceShader;
		forceShader.uniforms.texturePosition.value = position;
		forceShader.uniforms.textureVelocity.value = velocity;
		forceShader.uniforms.textureDensityPressure.value = densityPressure;
		renderer.render(scene, camera, output);

		var buffer = new Float32Array((WIDTH + 1) * (WIDTH + 1) * WIDTH);

		renderer.getContext().readPixels(output.offset.x, output.offset.y, WIDTH, WIDTH, gl.RGBA, gl.FLOAT, buffer);

		// console.log(buffer);
		// debugger;
		this.output = output;
	}

	this.renderPosition = function(position, velocity, densityPressure, force, output) {
		mesh.material = positionShader;
		positionShader.uniforms.texturePosition.value = position;
		positionShader.uniforms.textureVelocity.value = velocity;
		positionShader.uniforms.textureDensityPressure.value = densityPressure;
		positionShader.uniforms.textureForce.value = force;
		renderer.render(scene, camera, output);
		this.output = output;
	}

	this.renderVelocity = function(position, velocity, densityPressure, force, lastDensityPressure, lastForce, output) {
		mesh.material = velocityShader;
		velocityShader.uniforms.texturePosition.value = position;
		velocityShader.uniforms.textureVelocity.value = velocity;
		velocityShader.uniforms.textureDensityPressure.value = densityPressure;
		velocityShader.uniforms.textureForce.value = force;
		velocityShader.uniforms.lastTextureDensityPressure.value = lastDensityPressure;
		velocityShader.uniforms.lastTextureForce.value = lastForce;
		velocityShader.uniforms.time.value = performance && performance.now() || Date.now();
		renderer.render(scene, camera, output);
		this.output = output;
	}
}