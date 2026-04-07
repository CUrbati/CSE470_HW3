//t is between a and b
let a = -1;
let b = 1;

let thetaDomain = {min: 0, max: 2 * Math.PI};
let tDomain = {min: a, max: b};




function fCylinder(t){
    return 1;
}


//Since MV.js dislike matrix to vector multiplication, we simpify the SOR math. 
function SOR(theta, t) {

    return vec3(fCylinder(t) * Math.cos(theta), t, fCylinder(t)*Math.sin(theta));

}

vertices = [];
normals = [];


function generateSOR() {

    for (let theta = thetaDomain.min; theta < thetaDomain.max; theta += 0.1) {
        for (let t = tDomain.min; t <= tDomain.max; t += 0.1) {
            vertices.push(SOR(theta, t));
            normals.push(vec3(Math.cos(theta), 0, Math.sin(theta)));
        }
    }
}



