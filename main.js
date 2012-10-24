// This code is by John Weachock (jweachock@gmail.com)
// Do what you want with it. Give me credit if you feel like it.
// Comments, criticism, questions, etc. are all welcome.

// Calculates the hypotenuse of a triangle
Math.dist=function(dx,dy) {
	return Math.sqrt(dx*dx+dy*dy);
}

// HSL | color generator
function HSL(h,s,l) {
	this.h=h;
	this.s=s;
	this.l=l;
	this.v="hsl("+Math.round(h)+","+Math.round(s*100)+"%,"+Math.round(l*100)+"%)";
}

// f | Polar graph function for the final shape
function f(t) {
	// Heart curve from Wolfram Math World (http://mathworld.wolfram.com/HeartCurve.html)
	var x=16*Math.pow(Math.sin(t),3);
	var y=-1*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
	return [x,y];
}

// SURFACE | Handles the canvas and stuff
function Surface() {
	// Grabs the canvas element
	this.canvas=document.getElementById("surface");

	// If the browser supports it, let's hit that up!
	if(this.canvas.getContext) {
		// Grab the 2D context and scale the canvas to the full browser size
		this.context=this.canvas.getContext("2d");
		this.canvas.width=window.innerWidth;
		this.canvas.height=window.innerHeight;
		this.width=parseInt(this.canvas.width);
		this.height=parseInt(this.canvas.height);

		// Mouse position
		this.mx=0;
		this.my=0;

		// Number of particles and the base array of elements
		this.parts=500;
		this.elements=[];

		// Populate the elements
		for(var a=0;a<this.parts;a++) {
			// Radian position of the current particle number
			var t=a/this.parts*Math.PI*2;

			// Get the destination position via the graph function
			// and scale it to be actually visible
			var z=f(t);
			z[0]*=10;
			z[0]+=this.width/2;
			z[1]*=10;
			z[1]+=this.height/2;

			// Get the smallest dimension of the browser
			var r=Math.min(this.height/2,this.width/2);

			// Make a new particle with a rainbow'd color and radius of 3px
			var e=new Particle(this,new HSL(a*360/this.parts,1,0.5),3);

			// Set its initial position in a circle around the center
			e.setPos(this.width/2 + r*Math.cos(t-Math.PI/2), this.height/2 + r*Math.sin(t-Math.PI/2));

			// Set its destination position to a point around the curve
			e.setTarget(z[0],z[1]);

			// Delay its release
			e.setDelay(a*2);

			// Push it into the elements array
			this.elements.push(e);
		}

		// Start the engine
		this.step();
	} else {
		// BUMMER
		alert("No <canvas> support.");
	}
}

// SURFACE:step | Primary frame handler
Surface.prototype.step=function() {
	// Draw a black alpha rectangle over the whole canvas to create "trails" behind each particle
	this.context.fillStyle="rgba(0,0,0,0.05)";
	this.context.fillRect(0,0,this.width,this.height);
	
	// Loop through the elements
	for(var i=0;i<this.elements.length;i++) {
		var o=this.elements[i];
		// If it's a thing, has a step(), and has a draw()...
		if(o && o.step && o.draw) {
			// Step and draw it
			o.step();
			o.draw();
		}
	}

	// Set a timeout to call this again in 10ms (pretty much whatever the fastest available interval is)
	setTimeout("surface.step()",10);
}

// SURFACE:moused | Called when the a mouse button is pressed
//				  | Launches all of the particles off in random directions
//				  | Note: does *not* change the delay - any unreleased
//				  | particles will remain held at their starting position
//				  | and launche in their new direction when they can
Surface.prototype.moused=function(e) {
	for(var i=0;i<this.elements.length;i++) {
		var e=this.elements[i];
		e.dx=Math.random()*30-15;
		e.dy=Math.random()*30-15;
	}
}

// SURFACE:mousem | Called when the mouse moves on the page
//				  | Stores the mouses position to allow particle warping later
Surface.prototype.mousem=function(e) {
	this.mx=e.pageX;
	this.my=e.pageY;
}

// ELEMENT | Basic element to be drawn on the canvas
function Element(surface) {}
Element.prototype.draw=function() {} // Draws the element
Element.prototype.step=function() {} // Called every frame before drawing

// ELEMENT:setPos | Sets the x and y positions of this elements
Element.prototype.setPos=function(x,y) {
	this.x=x;
	this.y=y;
}

// PARTICLE | More detailed element with 
function Particle(surface,color,radius) {
	this.surface=surface;
	this.color=color;
	this.radius=radius;
	this.dx=0;
	this.dy=0;
	this.fz=[0.99,0.9];
}
Particle.prototype=new Element();

// PARTICLE:setDelay | Sets the launch countdown
//					 | The particle will remain immobile until t frames have passed
Particle.prototype.setDelay=function(t) {
	this.delay=t;
}

// PARTICLE:setTarget | Sets the destination position
Particle.prototype.setTarget=function(x,y) {
	this.tx=x;
	this.ty=y;
}

// PARTICLE:ELEMENT:step | Updates the position and acceleration every frame
Particle.prototype.step=function() {
	// Don't do anything until we've delayed enough
	if(this.delay>0) return this.delay--;
	
	// Ready-to-be-math'd variables for mouse warping
	var rx=this.tx;
	var ry=this.ty;

	// Get distance from cursor
	var mx=this.surface.mx-this.x;
	var my=this.surface.my-this.y;
	var m=Math.dist(mx,my);

	// Warp target position by distance from cursor
	rx-=8000*mx/m/m;
	ry-=8000*my/m/m;

	// Get distance from warped target
	var dx=rx-this.x;
	var dy=ry-this.y;
	var d=Math.dist(dx,dy);

	// Adjust "friction"
	var z;
	if(d<=1 && Math.dist(this.dx,this.dy)<=1) z=1;
	else z=0;

	// Accelerate towards
	this.dx+=dx/d/10;
	this.dy+=dy/d/10;

	// Apply "friction"
	this.dx*=this.fz[z];
	this.dy*=this.fz[z];

	// Adjust position based on acceleration
	this.x+=this.dx;
	this.y+=this.dy;
}

// PARTICLE:ELEMENT:draw | Draws the particle
Particle.prototype.draw=function() {
	this.surface.context.beginPath();
	this.surface.context.fillStyle=this.color.v;
	this.surface.context.arc(this.x,this.y,this.radius,0,Math.PI*2);
	this.surface.context.fill();
}

// jQuery to set everything up on page load
var surface;
$(function() {
	// Make a new Surface
	surface=new Surface();

	// Bind events
	surface.canvas.addEventListener("mousedown",function(e) {surface.moused(e)},true);
	surface.canvas.addEventListener("mousemove",function(e) {surface.mousem(e)},true);

	// Disable right clicks
	window.addEventListener("selectstart",function(e) {e.preventDefault()},true);
	window.addEventListener("contextmenu",function(e) {e.preventDefault()},true);
});
