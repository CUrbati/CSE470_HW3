var canvas;
var gl;
var program;
//-----------------------------------
//Lighting parameters
//White Light
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialNum = 0;
var objectNum = 0;
var t = 0;
var loopLight = false;
// eye location and parameters to move
var viewer = 
{
	eye: vec3(0.0, 0.0, 3.0),
	at:  vec3(0.0, 0.0, 0.0),  
	up:  vec3(0.0, 1.0, 0.0),
	
	// for moving around object; set vals so at origin
	radius: 3,
    theta: 0,
    phi: 0
};

// Create better params that suit your geometry
var perspProj = 
 {
	fov: 60,
	aspect: 1,
	near: 0.1,
	far:  100
 }

 // mouse interaction
 
var mouse =
{
    prevX: 0,
    prevY: 0,

    leftDown: false,
    rightDown: false,
};

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

function printEyeAtUp() {
   console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
}

function printPerspective() {
   console.log("perspective(fov, aspect, near, far) = ",perspProj.fov, perspProj.aspect, perspProj.near, perspProj.far);  
}

function printLightposition(lightPosition) {
   console.log("lightPosition = ",lightPosition);
}

window.onload = function init()
{

    // notice that gl-canvas is specified in the html code
    canvas = document.getElementById( "gl-canvas" );


    // gl is a canvas object
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //Logs canvas object was created
    console.log("Opened canvas");

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 0.169, 0.43, 0.741, 1.0 );

   generateSOR();
   printMinMaxBox();
   printEyeAtUp();
   printPerspective();
   
   generateIndices();
   generateNormals();

    //Z-Buffer on
    gl.enable(gl.DEPTH_TEST);


    //Load shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);
    

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    //set up camera
     viewer.eye = vec3(center[0], center[1], center[2] + 3);
     viewer.at = center;
     viewer.up = vec3(0, 1, 0);

    modelViewMatrix = lookAt(viewer.eye, viewer.at, viewer.up);
    projectionMatrix = perspective(perspProj.fov, perspProj.aspect, perspProj.near, perspProj.far);

    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    //Set light position    
    lightPosition = vec4(0.0, 0.0, 0.0, 1.0);

   printLightposition(lightPosition);

    ambientProduct = mult(lightAmbient, matericalList[0].ambient);
    diffuseProduct = mult(lightDiffuse, matericalList[0].diffuse);
    specularProduct = mult(lightSpecular, matericalList[0].specular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),matericalList[0].shininess);
    


   // ========================== Camera control via mouse ============================================
	// There are 4 event listeners: onmouse down, up, leave, move
	//
	// on onmousedown event
	// check if left/right button not already down
	// if just pressed, flag event with mouse.leftdown/rightdown and stores current mouse location
    document.getElementById("gl-canvas").onmousedown = function (event)
    {
        if(event.button == 0 && !mouse.leftDown)
        {
            mouse.leftDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        }
        else if (event.button == 2 && !mouse.rightDown)
        {
            mouse.rightDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        }
    };

	// onmouseup event
	// set flag for left or right mouse button to indicate that mouse is now up
    document.getElementById("gl-canvas").onmouseup = function (event)
    {
        // Mouse is now up
        if (event.button == 0)
        {
            mouse.leftDown = false;
        }
        else if(event.button == 2)
        {
            mouse.rightDown = false;
        }

    };

	// onmouseleave event
	// if mouse leaves canvas, then set flags to indicate that mouse button no longer down.
	// This might not actually be the case, but it keeps input from the mouse when outside of app
	// from being recorded/used.
	// (When re-entering canvas, must re-click mouse button.)
    document.getElementById("gl-canvas").onmouseleave = function ()
    {
        // Mouse is now up
        mouse.leftDown = false;
        mouse.rightDown = false;
    };

	// onmousemove event
	// Move the camera based on mouse movement.
	// Record the change in the mouse location
	// If left mouse down, move the eye around the object based on this change
	// If right mouse down, move the eye closer/farther to zoom
	// If changes to eye made, then update modelview matrix

    document.getElementById("gl-canvas").onmousemove = function (event)
    {
		// only record changes if mouse button down
		if (mouse.leftDown || mouse.rightDown) {
			
			// Get changes in x and y at this point in time
			var currentX = event.clientX;
			var currentY = event.clientY;
			
			// calculate change since last record
			var deltaX = event.clientX - mouse.prevX;
			var deltaY = event.clientY - mouse.prevY;
			
			console.log("enter onmousemove with left/right button down");
			console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
			console.log("event clientX = ",currentX,"  clientY = ",currentY);
			console.log("mouse.prevX = ",mouse.prevX,"  prevY = ",mouse.prevY);
			console.log("change in mouse location deltaX = ",deltaX,"  deltaY = ",deltaY);

			// Compute camera rotation on left click and drag
			if (mouse.leftDown)
			{
				console.log("onmousemove and leftDown is true");
				console.log("theta=",viewer.theta,"  phi=",viewer.phi);
				
				// Perform rotation of the camera
				//
				if (viewer.up[1] > 0)
				{
					viewer.theta -= 0.01 * deltaX;
					viewer.phi -= 0.01 * deltaY;
				}
				else
				{
					viewer.theta += 0.01 * deltaX;
					viewer.phi -= 0.01 * deltaY;
				}
				console.log("incremented theta=",viewer.theta,"  phi=",viewer.phi);
				
				// Wrap the angles
				var twoPi = 6.28318530718;
				if (viewer.theta > twoPi)
				{
					viewer.theta -= twoPi;
				}
				else if (viewer.theta < 0)
				{
					viewer.theta += twoPi;
				}

				if (viewer.phi > twoPi)
				{
					viewer.phi -= twoPi;
				}
				else if (viewer.phi < 0)
				{
					viewer.phi += twoPi;
				}
				console.log("wrapped  theta=",viewer.theta,"  phi=",viewer.phi);

			} // end mouse.leftdown
			else if(mouse.rightDown)
			{
				console.log("onmousemove and rightDown is true");
				
				// Perform zooming; don't get too close           
				viewer.radius -= 0.01 * deltaX;
				viewer.radius = Math.max(0.1, viewer.radius);
			}
			
			//console.log("onmousemove make changes to viewer");
			
			// Recompute eye and up for camera
			var threePiOver2 = 4.71238898;
			var piOver2 = 1.57079632679;		
			var pi = 3.14159265359;
			
			//console.log("viewer.radius = ",viewer.radius);
			
			// pre-compute this value
			var r = viewer.radius * Math.sin(viewer.phi + piOver2);
			
			// eye on sphere with north pole at (0,1,0)
			// assume user init theta = phi = 0, so initialize to pi/2 for "better" view
			
			viewer.eye = vec3(r * Math.cos(viewer.theta + piOver2), viewer.radius * Math.cos(viewer.phi + piOver2), r * Math.sin(viewer.theta + piOver2));
			
			//add vector (at - origin) to move 
			for(k=0; k<3; k++)
				viewer.eye[k] = viewer.eye[k] + viewer.at[k];
			
			//console.log("theta=",viewer.theta,"  phi=",viewer.phi);
			//console.log("eye = ",viewer.eye[0],viewer.eye[1],viewer.eye[2]);
			//console.log("at = ",viewer.at[0],viewer.at[1],viewer.at[2]);
			//console.log(" ");
			
			// modify the up vector
			// flip the up vector to maintain line of sight cross product up to be to the right
			// true angle is phi + pi/2, so condition is if angle < 0 or > pi
			
			if (viewer.phi < piOver2 || viewer.phi > threePiOver2) {
				viewer.up = vec3(0.0, 1.0, 0.0);
			}
			else {
				viewer.up = vec3(0.0, -1.0, 0.0);
			}
			//console.log("up = ",viewer.up[0],viewer.up[1],viewer.up[2]);
			//console.log("update viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
			
			// Recompute the view
			mvMatrix = lookAt(vec3(viewer.eye), viewer.at, viewer.up);
			
			console.log("mvMatrix = ",mvMatrix);
			 

			mouse.prevX = currentX;
			mouse.prevY = currentY;
			
			
			console.log("onmousemove: made change");
			console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
		
		}  // end if button down

    
   }

   document.getElementById("materials").onchange = function(event) {
      materialNum = parseInt(event.target.value);
      console.log("selected material index: ", materialNum);
      document.getElementById("shininess").value = matericalList[materialNum].shininess;

      ambientProduct = mult(lightAmbient, matericalList[materialNum].ambient);
      diffuseProduct = mult(lightDiffuse, matericalList[materialNum].diffuse);
      specularProduct = mult(lightSpecular, matericalList[materialNum].specular);

      gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
         flatten(ambientProduct));
      gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
         flatten(diffuseProduct) );
      gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
         flatten(specularProduct) );	
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
         flatten(lightPosition) );

   }


   document.getElementById("shininess").value = matericalList[materialNum].shininess;

   document.getElementById("shininess").oninput = function(event) {
      var shininess = parseFloat(event.target.value);
      console.log("selected shininess: ", shininess);
      gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

      document.getElementById("shininess").value = shininess;

   }
    

   document.getElementById("fov").oninput = function(event) {
      var fov = parseFloat(event.target.value);
      console.log("selected fov: ", fov);
      perspProj.fov = fov;
      projectionMatrix = perspective(perspProj.fov, perspProj.aspect, perspProj.near, perspProj.far);
      gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

      document.getElementById("fov").value = fov;

   }

   document.getElementById("objects").onchange = function(event) {
      objectNum = parseInt(event.target.value);
      console.log("selected object index: ", objectNum);

      if (objectNum == 0) {
         vertices = [];
         indices = [];
         normalsArray = [];
         generateSOR();
         printMinMaxBox();
         generateIndices();
         generateNormals();

         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);
         


         gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
         gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
         
         gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
         gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
         
      }
      else if (objectNum == 1) {
         vertices = [];
         indices = [];
         normalsArray = [];
         generateSORCurve();
         printMinMaxBox();
         generateIndices();
         generateNormals();

         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);
         


         gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
         gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
         
         gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
         gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
      }


   }
   render();

}



var restCount = 0;


function render()
{
   

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelViewMatrix = lookAt(vec3(viewer.eye), viewer.at, viewer.up);
	       
   gl.uniformMatrix4fv( gl.getUniformLocation(program,
         "modelViewMatrix"), false, flatten(modelViewMatrix) ); 

	gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );
	
   if(loopLight){
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
         flatten(vec4(3*Math.cos(t) + center[0], 0.0 + center[1], 3*Math.sin(t) + center[2], 1.0)) );
      t += 0.05;

   }else{
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
         flatten(lightPosition) );
   }
    
    requestAnimFrame( render );
}

// input is the number to format
// decimals is the number of decimals to print
function formatOut (input, decimals) {
  return Math.floor(input * Math.pow(10, decimals)) / Math.pow(10, decimals) }

function toggleLoopLight(){
   loopLight = !loopLight;
}
