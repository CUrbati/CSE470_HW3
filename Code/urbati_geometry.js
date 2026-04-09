//t is between a and b
let a = -1;
let b = 1;

let thetaDomain = {min: 0, max: 2 * Math.PI};
let tDomain = {min: a, max: b};

let numberOfVertices = 0;

let minX = 0;
let maxX = 0;
let minY = 0;
let maxY = 0;
let minZ = 0;
let maxZ = 0;
let center = vec3(0,0,0,);

//------------------------------------
//Materials parameters
// material properties

//Used to store materials so naming is easier. 
class Material {

    
    constructor(ambient, diffuse, specular, shininess) {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess * 128.0;
    }
}

var obsidian = new Material (vec4(0.05375, 0.05, 0.06625, 1.0), vec4(0.18275, 0.17, 0.22525, 1.0), vec4(0.332741, 0.328634, 0.346435, 1.0), 0.3);
var gold = new Material (vec4(0.24725, 0.1995, 0.0745, 1.0), vec4(0.75164, 0.60648, 0.22648, 1.0), vec4(0.628281, 0.555802, 0.366065, 1.0), 0.4);
var ruby = new Material (vec4(0.1745, 0.01175, 0.01175, 1.0), vec4(0.61424, 0.04136, 0.04136, 1.0), vec4(0.727811, 0.626959, 0.626959, 1.0), 0.6);


var temp = vec4(0.0, 0.0, 0.0, 1.0);

var materialAmbScale = 1.0;
var materialDiffScale = 1.0;
var materialSpecScale = 1.0;

var ambientColor, diffuseColor, specularColor;


var matericalList = [gold,obsidian, ruby];

function fCylinder(t){
    return 1;
}


//Since MV.js dislike matrix to vector multiplication, we simpify the SOR math. 
function SOR(theta, t) {

    return vec3(fCylinder(t) * Math.cos(theta), t, fCylinder(t)*Math.sin(theta));

}

vertices = [];
indices = [];
normalsArray = [];


function generateSOR() {

    
    //vertices.push(vec3(0, tDomain.min, 0));
    
    for (let t = tDomain.min; t <= tDomain.max; t += 0.1){
        for (let theta = thetaDomain.min; theta < thetaDomain.max; theta += 0.1) {

            let vertex = SOR(theta, t);

            if(vertex[0] < minX) {
                minX = vertex[0];
            }
            if(vertex[0] > maxX) {
                maxX = vertex[0];
            }
            if(vertex[1] < minY) {
                minY = vertex[1];
            }
            if(vertex[1] > maxY) {
                maxY = vertex[1];
            }
            if(vertex[2] < minZ) {
                minZ = vertex[2];
            }
            if(vertex[2] > maxZ) {
                maxZ = vertex[2];
            }

            vertices.push(vertex);
        }
    }


    //vertices.push(vec3(0, tDomain.max, 0));

    center = vec3((maxX + minX) / 2, (maxY + minY) / 2, (maxZ + minZ) / 2);

    console.log("vertices length: ", vertices.length);
}

function fCurve(t){
    return vec3(t*t*t+0.3, t, t*t*t+0.3); 
}


function SORCurve(theta, t) {
    
    let curve = fCurve(t);

    return vec3(curve[0] * Math.cos(theta), curve[1], curve[2]*Math.sin(theta));

}

function generateSORCurve() {

    
    //vertices.push(vec3(0, tDomain.min, 0));
    
    for (let t = tDomain.min+0.2; t <= tDomain.max-0.2; t += 0.1){
        for (let theta = thetaDomain.min; theta < thetaDomain.max; theta += 0.1) {

            let vertex = SORCurve(theta, t);

            if(vertex[0] < minX) {
                minX = vertex[0];
            }
            if(vertex[0] > maxX) {
                maxX = vertex[0];
            }
            if(vertex[1] < minY) {
                minY = vertex[1];
            }
            if(vertex[1] > maxY) {
                maxY = vertex[1];
            }
            if(vertex[2] < minZ) {
                minZ = vertex[2];
            }
            if(vertex[2] > maxZ) {
                maxZ = vertex[2];
            }

            vertices.push(vertex);
        }
    }

    //vertices.push(vec3(0, tDomain.max, 0));

    center = vec3((maxX + minX) / 2, (maxY + minY) / 2, (maxZ + minZ) / 2);
    
}


numberOfVertices = vertices.length;


function generateIndices(){
    indices = [];

    //Becuase the way I generated the vertices, I can assume that "rows" or chunks of 63 verticies
    //correspond to a row of the SOR. So I can use this to generate the indices for the triangles.
    for (let i = 0; i < vertices.length - 63; i++) 
    {
        if((i + 1) % 63 != 0) {
            indices.push(i);
            indices.push(i + 1);
            indices.push(i + 63);

            indices.push(i + 1);
            indices.push(i + 64);
            indices.push(i + 63);
        }
        else {
            indices.push(i);
            indices.push(i - 62);
            indices.push(i + 63);

            indices.push(i - 62);
            indices.push(i + 1);
            indices.push(i + 63);
        }

    }

    

    

    
}


function generateNormals() {
    //Sanity check to make sure the array is empty before we start adding to it.
    normalsArray = [];
    
    //Fill out the normals array with 0s so we can add to them.
    for (let i = 0; i < vertices.length; i++) {
        normalsArray[i] = vec3(0,0,0);
    }

    for (let i = 0; i < indices.length; i += 3) {

        //Get the three vertices index for this triangle
        let v1 = indices[i];
        let v2 = indices[i + 1];
        let v3 = indices[i + 2];

        //Get the three vertices for this triangle
        let p1 = vertices[v1];
        let p2 = vertices[v2];
        let p3 = vertices[v3];
        
        //Calculate the normal for this triangle
        let t1 = subtract(p2, p1);
        let t2 = subtract(p3, p1);

        let normal = cross(t2, t1);
        
        //Add this normal to the normals for each vertex of this triangle
        //Basically average them.
        normalsArray[v1] = add(normalsArray[v1], normal);
        normalsArray[v2] = add(normalsArray[v2], normal);
        normalsArray[v3] = add(normalsArray[v3], normal);
    }


    //Normalize the normals so they are unit vectors and behave correctly with the lighting model.
    for (let i = 0; i < normalsArray.length; i++) {
        normalsArray[i] = normalize(normalsArray[i]);
    }
}




vertexColor = [];
function generateColors() {
    for (let i = 0; i < vertices.length; i++) {
        vertexColor.push(vec4(0.749, 0.741, 0.239, 1.0));
    }
}

function printMinMaxBox(){
    console.log("--MIN MAX BOX--");
    console.log("Min X: " + minX);
    console.log("Max X: " + maxX);
    console.log("Min Y: " + minY);
    console.log("Max Y: " + maxY);
    console.log("Min Z: " + minZ);
    console.log("Max Z: " + maxZ);
    console.log("Center: " + center);
    console.log("--------------");
}
