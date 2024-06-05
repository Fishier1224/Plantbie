import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import { Text_Line } from './examples/text-demo.js';
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Shader, Texture, Material, Scene,
} = tiny;

//inclusive
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Zombie{
  constructor(x,y,z,t,type){
     this.base = [2*(x-1),y+0.05,2*(z-1)];                   //this should be the grid's coordinate
     this.birth_time = t;
     this.eating_time = 0;
     this.speed = [0.5,0,0];                //this is a speed vector per second (t)
     this.upper_left_near_offset = [-0.5,2.5,-0.5];      //current base coordinate + offset = point. THESE ARE TENTATIVE AND NEEDS TO BE TESTED
     this.lower_right_far_offset = [0.5,0,0.5];
     this.type = type;  //normal, flag, conehead, bucket
     if(type==="normal"){
         this.health = 100;
     }
     else if(type==="flag"){
          this.health = 150;
      }
     else if(type==="conehead"){
          this.health = 200;
      }
     else {this.health = 300;} //bucket
  }
}

class Square extends Shape {
    constructor() {
        super("position", "normal");
        this.arrays.position = Vector3.cast(
            [-0.5, 0, -0.5], [0.5, 0, -0.5], [-0.5, 0, 0.5],
            [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5]
        );
        this.arrays.normal = Vector3.cast(
            [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [0, 1, 0], [0, 1, 0], [0, 1, 0]
        );
        this.arrays.texture_coord = Vector.cast(
            [0, 0], [1, 0], [0, 1],
            [1, 0], [1, 1], [0, 1]
        );
        this.indices = false;

        this.arrays.position = this.arrays.position.concat(Vector3.cast(
            [-0.55, 0, -0.55], [0.55, 0, -0.55], [-0.55, 0, 0.55],
            [0.55, 0, -0.55], [0.55, 0, 0.55], [-0.55, 0, 0.55]
        ));
        this.arrays.normal = this.arrays.normal.concat(Vector3.cast(
            [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [0, 1, 0], [0, 1, 0], [0, 1, 0]
        ));
        this.arrays.texture_coord = this.arrays.texture_coord.concat(Vector.cast(
            [0, 0], [1, 0], [0, 1],
            [1, 0], [1, 1], [0, 1]
        ));

    }
}

class Cloud extends Shape {
    constructor() {
        super("position", "texture_coord");
        // Define a simple quad for the cloud
        this.arrays.position = Vector3.cast(
            [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]
        );
        this.arrays.texture_coord = Vector.cast(
            [0, 0], [1, 0], [1, 1], [0, 1]
        );
        this.indices = [0, 1, 2, 0, 2, 3];
    }
}

class VerticalRectangle extends Shape {
    constructor() {
        super("position", "normal");
        this.arrays.position = Vector3.cast(
            [0, -0.5, -0.5], [0, 0.5, -0.5], [0, -0.5, 0.5],
            [0, 0.5, -0.5], [0, 0.5, 0.5], [0, -0.5, 0.5]
        );
        this.arrays.normal = Vector3.cast(
            [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [1, 0, 0], [1, 0, 0], [1, 0, 0]
        );
        this.arrays.texture_coord = Vector.cast(
            [0, 0], [1, 0], [0, 1],
            [1, 0], [1, 1], [0, 1]
        );
        this.indices = false;
    }
}

export class Plantbie extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.mousex;
        this.mousey;

        this.start = false;
        this.loading_sound = new Audio("./assets/loading_sound.mp3");
        this.game_sound = new Audio("./assets/game_sound.mp3");
        // Drawing queue for purchased items
        this.userdraw = "none";
        this.item_queue = [];
        this.zombies = [];
        this.game_end = false;
        this.test = false; //testing variable
        this.prev_t = 0;

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            peashooter: new Shape_From_File("./assets/peashooter.obj"),
            square: new Square(),
            sun: new Shape_From_File("./assets/sphere.obj"),
            buffer: new defs.Cube(),
            cloud: new Shape_From_File("./assets/cloud.obj"),
            sky: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            ground: new defs.Square(),
            headstone: new Shape_From_File("./assets/headstone.obj"),
            peashooter_hair: new Shape_From_File("./assets/peashooter_hair.obj"),
            peashooter_neck: new Shape_From_File("./assets/peashooter_neck_2.obj"),
            peashooter_leaf: new Shape_From_File("./assets/melon_leaf.obj"), //turns out melon leaf is better rendered than peashooter leaf
            peashooter_head: new Shape_From_File("./assets/peashooter_head_2.obj"),
            watermelon_leaf: new Shape_From_File("./assets/melon_leaf.obj"),
            watermelon_bullet_holder: new Shape_From_File("./assets/melon_bullet_holder_3.obj"),
            watermelon_neck: new Shape_From_File("./assets/melon_neck.obj"),
            watermelon_bullet: new Shape_From_File("./assets/melon_bullet.obj"),
            watermelon_head: new Shape_From_File("./assets/melon_head.obj"),
            watermelon_eyes: new Shape_From_File("./assets/melon_eye.obj"),
            text: new Text_Line(5),
            //zombie parts
            zombie_head: new Shape_From_File("./assets/zombie/zombie_head.obj"),
            zombie_torso: new Shape_From_File("./assets/zombie/zombie_torso.obj"),
            zombie_left_leg: new Shape_From_File("./assets/zombie/zombie_right_leg.obj"),
            zombie_right_leg: new Shape_From_File("./assets/zombie/zombie_left_leg.obj"),
            zombie_left_upper_arm: new Shape_From_File("./assets/zombie/left_upper_arm.obj"),
            //note that I made a mistake for the lower arms, I swapped the left & right side. So here this is addressing that. I also actually swapped the upper arms, but they don't matter after rotation
            zombie_left_lower_arm: new Shape_From_File("./assets/zombie/right_lower_arm.obj"),
            zombie_right_upper_arm: new Shape_From_File("./assets/zombie/right_upper_arm.obj"),
            zombie_right_lower_arm: new Shape_From_File("./assets/zombie/left_lower_arm.obj"),
            conehead: new Shape_From_File("./assets/zombie/conehead.obj"),
            bucket: new Shape_From_File("./assets/zombie/bucket.obj"),
            flag: new Shape_From_File("./assets/zombie/flag.obj"),
            // text: new Text_Line(35),
            pea: new defs.Subdivision_Sphere(4),


            //cloud: new Cloud(),
            //outlined_square: new Outlined_Square(),
        };

        const textured = new defs.Textured_Phong();
        const texture = new defs.Textured_Phong(1);
        // *** Materials
        this.materials = {
            // menu
            text_image: new Material(texture, {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
            menu: new Material(textured, {
                ambient: 0.9,
                diffusivity: .9,
                color: hex_color("#000000"),
                texture: new Texture("assets/sky-gradient.jpg")
            }),
            menubuttons: new Material(textured, {
                ambient: 0.9,
                diffusivity: 1,
                specularity: 1,
                color: hex_color("#FFFFFF"),
                texture: new Texture("assets/sky-gradient.png")}),
            //characters
            peashooter: new Material(new defs.Phong_Shader(), {
                ambient: 0.67,
                diffusivity: 0.5,
                specularity: 0.05,
                color: hex_color("#00FF00")
            }),
            cloud: new Material(new defs.Phong_Shader(), {
                ambient: 0.9,
                diffusivity: 0.9,
                specularity: 1,
                color: hex_color("#FFFFFF")
            }),
            square: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 1,
                specularity: 1,
                color: hex_color("#006400")
            }),
            outlined_square: new Material(new defs.Phong_Shader(), { // Material for outline
                ambient: 0.5,
                diffusivity: 0.5,
                specularity: 0.05,
                color: hex_color("#002800")
            }),
            sun: new Material(new defs.Phong_Shader(), {
                ambient: 0.5,
                diffusivity: 0.5,
                specularity: 0.05,
                color: hex_color("#FFD700")  // Bright yellow for the sun
            }),
            headstone: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                disffusivity: 0.5,
                specularity: 1,
                color: hex_color("#000000")
            }),
            buffer: new Material(new defs.Phong_Shader(), {
                color: hex_color("#000000"),
                ambient: 0.5,
                diffusivity: 0.5,
                specularity: 0.05,
            }),
            buffer_highlight: new Material(new defs.Phong_Shader(), {
                color: hex_color("#FFD700"),
                ambient: 0.5,
                diffusivity: 0.5,
                specularity: 0.05,
            }),
            vertical_rectangle: new Material(textured, {
                color: hex_color("#87CEEB"),
                ambient: 1,
                diffusivity: 0.9,
                specularity: 1,
            }),
            sky: new Material(new defs.Phong_Shader(), {
                ambient: 0.9,
                diffusivity: 0.1,
                specularity: 0,
                color: hex_color("#87CEEB"),
            }),
            ground: new Material(new defs.Phong_Shader(), {
                ambient: 0.5,
                diffusivity: 0.5,
                specularity: 0.05,
                color: hex_color("#666666")
            }),
            melon_eye: new Material(new defs.Phong_Shader(), {
                ambient: 0.67,
                diffusivity: 0.5,
                specularity: 0.05,
                color: hex_color("#000000")
            }),
            black: new Material(new defs.Phong_Shader(), {
                ambient: 0.4,
                diffusivity: 0.6,
                color: hex_color("#000000")
            }),
            pea: new Material(new defs.Phong_Shader(), {
                ambient: 0.4,
                diffusivity: 0.6,
                specularity: 0.05,
                color: hex_color("#0AFF0A")
            }),
            //{ambient: 1, diffusivity: .9, specularity: 1, color: hex_color("#000000")
            /*
            cloud: new Material(new defs.Textured_Phong(), {
                color: hex_color("#FFFFFF"),
                ambient: 1,
                texture: new Texture("./assets/cloud.png")  // Cloud texture with transparency
            }),
             */
        }
        this.starting = false;
        this.grid_index = [0, 0];
        this.buffer_index = 0;
        this.current_planet = "default"
        this.current_empty = "empty"
        const grass_grid = new Map();

        this.initial_camera_location = Mat4.look_at(vec3(0, 5, 15), vec3(0, 1.5, 1.5), vec3(0, 1.5, 1.5))
        this.grid_positions = [];
        this.change_view = false;
        this.create_grid();
        this.plant_here = new Array(45).fill(0);
        this.cool_down = new Array(45).fill(-1);

        this.peas = []
        this.buf_plants = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    }

    create_grid() {
        const rows = 5;
        const cols = 9;
        const size = 2;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.grid_positions.push([j * size, 0, i * size]);
            }
        }
    }

    render_dead_zombie(context,program_state,x,y,z,t){
        //pass
    }

//type is a string, "normal"/"conehead"/"bucket"/"flag"
    render_walking_zombie(context, program_state, x, y, z, t, type) {
        //this is because there is an offset, grid is CENTERED at (0,y,0), but that point is actually (5,y,3)
        let base_matrix = Mat4.identity()
            .times(Mat4.translation(x-8,y,z-4),);
        let leg_movement = Mat4.translation(0,0.3*Math.sin(2*(t+Math.PI/2)),0);
        let left_leg_matrix = base_matrix.times(Mat4.scale(0.3,0.3,0.3)).times(Mat4.translation(-0.5,1,1)).times(leg_movement);
        left_leg_matrix = left_leg_matrix.times(Mat4.rotation(-Math.PI/4-0.7,0,1,0));
        this.shapes.zombie_left_leg.draw(context, program_state, left_leg_matrix, this.materials.peashooter);
        let leg_movement_2 = Mat4.translation(0,0.3*Math.sin(2*(t)),0)
        let right_leg_matrix = base_matrix.times(Mat4.scale(0.3,0.3,0.3)).times(Mat4.translation(0,1,-1).times(leg_movement_2));
        right_leg_matrix = right_leg_matrix.times(Mat4.rotation(-Math.PI/4-0.5,0,1,0));
        this.shapes.zombie_right_leg.draw(context, program_state, right_leg_matrix, this.materials.peashooter);
        base_matrix = base_matrix.times(Mat4.translation(0,0.015*Math.sin(1.5*(t+Math.PI/4)),0));
        let torso_matrix = base_matrix.times(Mat4.scale(0.6,0.6,0.6)).times(Mat4.translation(-0.2,2.7,0));
        torso_matrix = torso_matrix.times(Mat4.rotation(-Math.PI/4-1,0,1,0)).times(Mat4.rotation(-0.2,1,0,0));
        // let torso_rotation_matrix = Mat4.rotation(0.2*Math.sin(2*t),1,0,0)
        // torso_matrix = torso_matrix.times(torso_rotation_matrix);
        this.shapes.zombie_torso.draw(context, program_state, torso_matrix, this.materials.peashooter);
        let left_upper_arm_matrix = base_matrix.times(Mat4.translation(-0.25,1.7,0.5)).times(Mat4.scale(0.15,0.15,0.15));
        left_upper_arm_matrix=left_upper_arm_matrix.times(Mat4.rotation(Math.PI/4+0.5,0,1,0));
        this.shapes.zombie_left_upper_arm.draw(context, program_state, left_upper_arm_matrix, this.materials.peashooter);
        let left_lower_arm_matrix = Mat4.translation(-.1,-.8,0).times(left_upper_arm_matrix.times(Mat4.scale(2,2,2)));
        left_lower_arm_matrix = left_lower_arm_matrix.times(Mat4.rotation(Math.PI+0.5,0,1,0));
        this.shapes.zombie_left_lower_arm.draw(context, program_state, left_lower_arm_matrix, this.materials.peashooter);
        let right_upper_arm_matrix = base_matrix.times(Mat4.translation(-0.25,1.7,-0.5)).times(Mat4.scale(0.15,0.15,0.15));
        right_upper_arm_matrix=right_upper_arm_matrix.times(Mat4.rotation(Math.PI/4+0.5,0,1,0));
        this.shapes.zombie_right_upper_arm.draw(context, program_state, right_upper_arm_matrix, this.materials.peashooter);
        this.shapes.zombie_left_upper_arm.draw(context, program_state, left_upper_arm_matrix, this.materials.peashooter);
        let right_lower_arm_matrix = Mat4.translation(-.1,-.8,0).times(right_upper_arm_matrix.times(Mat4.scale(2,2,2)));
        right_lower_arm_matrix = Mat4.translation(0,.15,0.1).times(right_lower_arm_matrix.times(Mat4.rotation(Math.PI+0.5,0,1,0)));
        if(type==="flag"){
            let flag_matrix = right_lower_arm_matrix;
            flag_matrix = (flag_matrix).times(Mat4.scale(2.5,2.5,2.5));
            flag_matrix = Mat4.translation(-0.5,1,0).times(flag_matrix);
            this.shapes.flag.draw(context, program_state, flag_matrix, this.materials.peashooter);
        }
        else
            this.shapes.zombie_right_lower_arm.draw(context, program_state, right_lower_arm_matrix, this.materials.peashooter);
        let head_matrix = base_matrix.times(Mat4.translation(-0.5,2.6,0)).times(Mat4.scale(0.25,0.25,0.25));
        // head_matrix = Mat4.rotation(0.015*Math.sin(1.5*t),0,0,1).times(head_matrix);
        //rotation pivot is a little lower, remember transformation is applied from right to left
        head_matrix = (head_matrix).times(Mat4.rotation(-Math.PI/4-0.5,0,1,0));
        this.shapes.zombie_head.draw(context, program_state, head_matrix, this.materials.peashooter);
        if(type==="bucket"){
            let bucket_matrix = Mat4.translation(0,0.3,0).times(head_matrix).times(Mat4.scale(1.6,1.6,1.6));
            this.shapes.bucket.draw(context, program_state, bucket_matrix, this.materials.black);
        }
        else if(type==="conehead"){
            let bucket_matrix = Mat4.translation(0.2,0.7,0).times(head_matrix).times(Mat4.scale(1.3,1.3,1.3));
            this.shapes.conehead.draw(context, program_state, bucket_matrix, this.materials.black);

        }

    }
    render_eating_zombie (context,program_state,x,y,z,t,type){
        let base_matrix = Mat4.identity()
            .times(Mat4.translation(x-8,y+0.05,z-4),);
        let left_leg_matrix = base_matrix.times(Mat4.scale(0.3,0.3,0.3)).times(Mat4.translation(-0.5,1,1));
        left_leg_matrix = left_leg_matrix.times(Mat4.rotation(-Math.PI/4-0.7,0,1,0));
        this.shapes.zombie_left_leg.draw(context, program_state, left_leg_matrix, this.materials.peashooter);
        let right_leg_matrix = base_matrix.times(Mat4.scale(0.3,0.3,0.3)).times(Mat4.translation(0,1,-1));
        right_leg_matrix = right_leg_matrix.times(Mat4.rotation(-Math.PI/4-0.5,0,1,0));
        this.shapes.zombie_right_leg.draw(context, program_state, right_leg_matrix, this.materials.peashooter);
        base_matrix = base_matrix.times(Mat4.translation(0,0.015*Math.sin(1.5*(t+Math.PI/4)),0));
        let torso_matrix = base_matrix.times(Mat4.scale(0.6,0.6,0.6)).times(Mat4.translation(-0.2,2.7,0));
        torso_matrix = torso_matrix.times(Mat4.rotation(-Math.PI/4-1,0,1,0)).times(Mat4.rotation(-0.2,1,0,0));
        // let torso_rotation_matrix = Mat4.rotation(0.2*Math.sin(2*t),1,0,0)
        // torso_matrix = torso_matrix.times(torso_rotation_matrix);
        this.shapes.zombie_torso.draw(context, program_state, torso_matrix, this.materials.peashooter);
        let left_upper_arm_matrix = base_matrix.times(Mat4.translation(-0.25,1.7,0.5)).times(Mat4.scale(0.15,0.15,0.15));
        left_upper_arm_matrix = left_upper_arm_matrix.times(Mat4.rotation(Math.PI/4+0.8,0,1,0));
        left_upper_arm_matrix=left_upper_arm_matrix.times(Mat4.rotation(Math.PI/4,1,0,0).times(Mat4.translation(0,0,-0.5)));
        left_upper_arm_matrix=left_upper_arm_matrix.times(Mat4.rotation(0.1*Math.sin(4*t+0.25),1,0,0).times(Mat4.translation(0,0,-0.5)));
        this.shapes.zombie_left_upper_arm.draw(context, program_state, left_upper_arm_matrix, this.materials.black);
        let left_lower_arm_matrix = Mat4.translation(-.1,-.8,0).times(left_upper_arm_matrix.times(Mat4.scale(2,2,2)));
        left_lower_arm_matrix = left_lower_arm_matrix.times(Mat4.rotation(Math.PI+0.5,0,1,0));
        left_lower_arm_matrix = Mat4.translation(-1.55,0.825,0).times(Mat4.rotation(-Math.PI/4,0,0,1)).times(left_lower_arm_matrix);
        this.shapes.zombie_left_lower_arm.draw(context, program_state, left_lower_arm_matrix, this.materials.black);
        let right_upper_arm_matrix = base_matrix.times(Mat4.translation(-0.25,1.7,-0.5)).times(Mat4.scale(0.15,0.15,0.15));
        right_upper_arm_matrix=right_upper_arm_matrix.times(Mat4.rotation(Math.PI/4+0.8,0,1,0));
        right_upper_arm_matrix=right_upper_arm_matrix.times(Mat4.rotation(Math.PI/4,1,0,0).times(Mat4.translation(0,0,-0.5)));
        right_upper_arm_matrix=right_upper_arm_matrix.times(Mat4.rotation(0.1*Math.sin(4*t+0.25),1,0,0).times(Mat4.translation(0,0,-0.5)));
        this.shapes.zombie_right_upper_arm.draw(context, program_state, right_upper_arm_matrix, this.materials.peashooter);
        let right_lower_arm_matrix = right_upper_arm_matrix;
        right_lower_arm_matrix = right_upper_arm_matrix.times(Mat4.translation(-.1,-.8,0)).times(Mat4.rotation(Math.PI,0,1,0)).times(Mat4.scale(2,2,2));
        if(type!=="flag") right_lower_arm_matrix = Mat4.translation(-0.4,-0.3,0.1).times(right_lower_arm_matrix);
        if(type==="flag"){
            let flag_matrix = right_lower_arm_matrix;
            flag_matrix = (flag_matrix).times(Mat4.scale(2.5,2.5,2.5));
            flag_matrix = Mat4.translation(0,0.7,-0.1).times(flag_matrix);
            this.shapes.flag.draw(context, program_state, flag_matrix, this.materials.peashooter);
        }
        else
            this.shapes.zombie_right_lower_arm.draw(context, program_state, right_lower_arm_matrix, this.materials.peashooter);
        let head_matrix = base_matrix.times(Mat4.translation(-0.5,2.6,0)).times(Mat4.scale(0.25,0.25,0.25));
        head_matrix = Mat4.rotation(0.015*Math.sin(1.5*t),0,0,1).times(head_matrix);
        //rotation pivot is a little lower, remember transformation is applied from right to left
        head_matrix = (head_matrix).times(Mat4.rotation(-Math.PI/4-0.5,0,1,0));
        this.shapes.zombie_head.draw(context, program_state, head_matrix, this.materials.peashooter);
        if(type==="bucket"){
            let bucket_matrix = Mat4.translation(0,0.3,0).times(head_matrix).times(Mat4.scale(1.6,1.6,1.6));
            this.shapes.bucket.draw(context, program_state, bucket_matrix, this.materials.black);
        }
        else if(type==="conehead"){
            let bucket_matrix = Mat4.translation(0.2,0.7,0).times(head_matrix).times(Mat4.scale(1.3,1.3,1.3));
            this.shapes.conehead.draw(context, program_state, bucket_matrix, this.materials.black);
        }
    }

    render_pea(context, program_state, x, y, z){

        // this.peas.append({grid, t});
        let pea_transform = Mat4.identity().times(Mat4.translation(x+0.2, y+1.13, z-0.1),);
        pea_transform = pea_transform.times(Mat4.scale(0.25, 0.25, 0.25));


        this.shapes.pea.draw(context, program_state, pea_transform, this.materials.pea);
    }


    render_peashooter(context,program_state,x,y,z,t){
        let plant_transform = Mat4.identity()
            .times(Mat4.translation(x-8,y+0.05,z-4),);
        plant_transform = plant_transform.times(Mat4.scale(0.35,0.35,0.35));

        plant_transform = plant_transform.times(Mat4.rotation(Math.PI / 2, 0, 1, 0));


        const leaf_flex = Math.sin(2 * Math.PI * t) * 0.1; // Adjust frequency and amplitude as needed
        let leaf_transform = plant_transform.times(Mat4.translation(0,leaf_flex,0));

        // leaf_transform = leaf_transform.times(Mat4.rotation(Math.PI / 2, 0, 1, 0));
        this.shapes.peashooter_leaf.draw(context, program_state, leaf_transform, this.materials.peashooter);
        // leaf_transform = leaf_transform.times(Mat4.rotation(-1 * Math.PI / 2,0,1,0));

        plant_transform = plant_transform.times(Mat4.translation(0, 1.5, -1));
        const neck_flex = Math.sin(2 * Math.PI * t) * 0.05; // Adjust frequency and amplitude as needed
        plant_transform = plant_transform.times(Mat4.rotation(neck_flex,1,0,0));

        // plant_transform = plant_transform.times(Mat4.rotation(Math.PI / 2,0,1,0));
        this.shapes.peashooter_neck.draw(context, program_state, plant_transform, this.materials.peashooter);
        // plant_transform = plant_transform.times(Mat4.rotation(-1 * Math.PI / 2,0,1,0));

        plant_transform = plant_transform.times(Mat4.translation(0, 2, 0));
        const head_bob = Math.sin(2*Math.PI * t) * 0.1; // Adjust frequency and amplitude as needed
        plant_transform = plant_transform.times(Mat4.translation(0, head_bob, 2*head_bob));

        // plant_transform = plant_transform.times(Mat4.rotation(Math.PI / 2,0,1,0));
        this.shapes.peashooter_head.draw(context, program_state, plant_transform, this.materials.peashooter);
        // plant_transform = plant_transform.times(Mat4.rotation(-1 * Math.PI / 2,0,1,0));

        plant_transform = plant_transform.times(Mat4.translation(-0.5, 0.25, -2.75));

        // plant_transform = plant_transform.times(Mat4.rotation(Math.PI / 2,0,1,0));
        this.shapes.peashooter_hair.draw(context, program_state, plant_transform, this.materials.peashooter);
        // plant_transform = plant_transform.times(Mat4.rotation(-1 * Math.PI / 2,0,1,0));
    }

    render_watermelon(context,program_state,x,y,z,t){
        let plant_transform = Mat4.identity()
            .times(Mat4.translation(x-8,y+0.05,z-4),);
        plant_transform = plant_transform.times(Mat4.scale(0.45,0.4,0.4));
        plant_transform = plant_transform.times(Mat4.rotation(Math.PI / 2, 0, 1, 0));
        const leaf_flex = Math.sin(2 * Math.PI * t) * 0.1; // Adjust frequency and amplitude as needed
        let leaf_transform = plant_transform.times(Mat4.translation(0,leaf_flex,0));
        this.shapes.watermelon_leaf.draw(context, program_state, leaf_transform, this.materials.peashooter);
        plant_transform=leaf_transform.times(Mat4.translation(0,1,0),);
        this.shapes.watermelon_head.draw(context,program_state,plant_transform, this.materials.peashooter);
        let eye_transform=leaf_transform.times(Mat4.translation(0.2,1,1.3),);
        eye_transform = eye_transform.times(Mat4.scale(0.4,0.4,0.4));
        this.shapes.watermelon_eyes.draw(context,program_state,eye_transform, this.materials.melon_eye);
        plant_transform=plant_transform.times(Mat4.translation(-0.5,1.3,-1.5),);
        const rot_factor = Math.sin(2*Math.PI*t)*0.1;
        plant_transform = plant_transform.times(Mat4.rotation(rot_factor, 1,0,0));
        let neck_transform = plant_transform.times(Mat4.rotation(Math.PI,0,1,0),);
        neck_transform = neck_transform.times(Mat4.scale(0.7,0.7,0.7),);
        this.shapes.watermelon_neck.draw(context,program_state,neck_transform, this.materials.peashooter);
        const rot_factor_2 = Math.sin(2*Math.PI*t)*0.1;
        plant_transform = plant_transform.times(Mat4.rotation(rot_factor_2, 1,0,0));
        plant_transform = plant_transform.times(Mat4.translation(-0.6,1,-1),);
        this.shapes.watermelon_bullet_holder.draw(context, program_state, plant_transform, this.materials.peashooter);
        let bullet_transform = plant_transform.times(Mat4.rotation(Math.PI,0,1,0),);
        bullet_transform = bullet_transform.times(Mat4.translation(0,1,-0.3),).times(Mat4.scale(1.2,1.2,1.2));
        this.shapes.watermelon_bullet.draw(context,program_state,bullet_transform, this.materials.peashooter);
    }



    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Start Game", ["s"], () => this.starting = !this.starting);
        this.new_line();
        this.key_triggered_button("select row one", ["1"], () => this.grid_index[0] = 0);
        this.key_triggered_button("select row two", ["2"], () => this.grid_index[0] = 1);
        this.key_triggered_button("select row three", ["3"], () => this.grid_index[0] = 2);
        this.key_triggered_button("select row four", ["4"], () => this.grid_index[0] = 3);
        this.key_triggered_button("select row five", ["5"], () => this.grid_index[0] = 4);
        this.new_line();
        this.key_triggered_button("select column one", ["q"], () => this.grid_index[1] = 0);
        this.key_triggered_button("select column two", ["w"], () => this.grid_index[1] = 1);
        this.key_triggered_button("select column three", ["e"], () => this.grid_index[1] = 2);
        this.key_triggered_button("select column four", ["r"], () => this.grid_index[1] = 3);
        this.key_triggered_button("select column five", ["t"], () => this.grid_index[1] = 4);
        this.key_triggered_button("select column six", ["y"], () => this.grid_index[1] = 5);
        this.key_triggered_button("select column seven", ["u"], () => this.grid_index[1] = 6);
        this.key_triggered_button("select column eight", ["i"], () => this.grid_index[1] = 7);
        this.key_triggered_button("select column nine", ["o"], () => this.grid_index[1] = 8);
        this.new_line();

        this.key_triggered_button("Buffer Move Left", ["ArrowLeft"], () => this.buffer_index = Math.max(0, this.buffer_index - 1));
        // this.key_triggered_button("Plant2", ["."], () => this.buffer_index = 1);
        this.key_triggered_button("Buffer Move Right", ["ArrowRight"], () => this.buffer_index = Math.min(9, this.buffer_index + 1));
        this.new_line();
        this.key_triggered_button("Plant", ["Enter"], () => {
                let temp = this.grid_index[0] * 9 + this.grid_index[1];
                if(this.plant_here[temp]===0) {
                    this.plant_here[temp] = 1; // here we should change the value to same as the buffer, which will have a int value to represent the type of plant stored in this buffer.
                    // for now, 1 stands for peashooters.
                    this.cool_down[temp] = 0;
                }
            }
        );// need to insert into array of plants;
        this.key_triggered_button("Remove Plant", ["Escape"], () => this.grass_grid.set(this.grid_index, this.current_empty));// need to remove from array of plants
        this.new_line();
        this.key_triggered_button("Rotate View Left", ["a"], () =>
            {
                this.change_view = true;
                this.initial_camera_location = this.initial_camera_location.times(Mat4.rotation(Math.PI / 2, 0, 1, 0));
            }
        );
        this.key_triggered_button("Rotate View Right", ["d"], () =>
            {
                this.change_view = true;
                this.initial_camera_location = this.initial_camera_location.times(Mat4.rotation(-1 * Math.PI / 2, 0, 1, 0));
            }
        );
    }




    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        const t = program_state.animation_time / 1000;
        const time_in_sec = t;
        const time_loading_screen = 0;
        const time_loading_screen_end = 9;
        this.game_sound.play();


        //this.loading_sound.play();
        if(this.change_view){
            program_state.set_camera(this.initial_camera_location);
            this.change_view = false;
        }
        else if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location)
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // Define the light for the scene
        const light_position = vec4(10, 7, -2, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let plant_transform = Mat4.identity()
            .times(Mat4.translation(0, 1, 0));
        // this.render_walking_zombie(context,program_state,8,0.05,4,t,"bucket");

        let cen = this.grid_positions[22];

        //-------- rendering zombies
        //Note that to render at coordinate "row 3 column 5", you need to instantiate z=3, x=5. The base coordinate is automatically converted.
        if (!this.test) {       //this is the random generator logic - here we manually render a zombie centered at (8,0.05,4). Note that we must follow the exact format to push in a zombie object
            let curZombie = new Zombie(5,0,3,t,"flag");
            this.zombies.push(curZombie);
            this.test = true;
        }
        // this.render_eating_zombie(context,program_state,8,0.05,4,t,"flag");
        for(let i=0;i<this.zombies.length;++i){
            let curZombie = this.zombies[i];
            let x = curZombie.base[0], y=curZombie.base[1], z=curZombie.base[2];
            if(curZombie.health<=0){
                this.render_dead_zombie(context,program_state,x,y,z,t);
                //remove this zombie from the zombie array since it is dead and set back the index
                this.zombies.splice(i,1);
                i--;
                continue;
            }
            if(curZombie.health<=100 && curZombie.type!=="normal"){
                //can implement corresponding utility fall here, optional tho
                this.zombies[i].type = "normal";
            }
            let dt = t-this.zombies[i].birth_time-this.zombies[i].eating_time;
            let displacement = dt*this.zombies[i].speed[0]; //for now zombies can only run straight in x direction. Note that speed is always positive
            x = x - displacement;
            if(x<=0){
                this.game_end = true;
                //this is the game end condition, trigger the game end screen and stop all other rendering
            }
            //calculate current grid
            let temp = Math.floor(z-1)*9+Math.floor(x);
            //means there is a plant here
            if(this.plant_here[temp]!==0){
                //problem: utilities & eating hands positions are affected by change / displacement in x for some reason
                this.render_eating_zombie(context,program_state,x,y,z,t,this.zombies[i].type);
                if(this.prev_t !== -1) this.zombies[i].eating_time = this.zombies[i].eating_time+(t-this.prev_t);      //total displacement should be base location - speed*(total time - eating time - birthtime)
                this.prev_t=t;
            }
            else{
                this.render_walking_zombie(context,program_state,x,y,z,t,this.zombies[i].type);
                this.prev_t  = -1;
            }
        }

        //---------rendering zombies finished


        for(let i=0; i<this.cool_down.length; i++){
            if(this.cool_down[i] === 0){
                this.cool_down[i] = t;
            }
        }

        const ind = this.grid_index[0] * 9 + this.grid_index[1];
        for (let i=0; i<this.grid_positions.length; i++) {
            const pos = this.grid_positions[i]// Draw each square in the grid
            let square_transform = Mat4.identity()
                .times(Mat4.translation(pos[0] - 8, pos[1], pos[2] - 4))
                .times(Mat4.scale(1.36, 1.36, 1.36));

            if(this.plant_here[i] !== 0){
                if(this.plant_here[i] === 1){
                    this.render_watermelon(context, program_state, pos[0], pos[1], pos[2], t);
                    if((t - this.cool_down[i]) > 0 && (t - this.cool_down[i]) < 0.1){
                        this.peas.push([i, t]);
                        this.cool_down[i] = t + 2.5;

                    }
                }
            }
            // Draw the inner square
            if(i === ind){
                this.materials.square.color = this.select_color;
                this.shapes.square.draw(context, program_state, square_transform, this.materials.square.override({color:hex_color("FFFF00")}));
                this.materials.square.color = this.normal_color;
            }
            else{
                this.shapes.square.draw(context, program_state, square_transform, this.materials.square.override({color:hex_color("006400")}));
            }

            // Draw the outline
            let outline_transform = square_transform.times(Mat4.scale(1.3, 1.3, 1.3)); // Slightly larger for outline
            this.shapes.square.draw(context, program_state, outline_transform, this.materials.outlined_square);
        }

        // this.shapes.test_rec.draw(context, program_state, Mat4.identity(), this.materials.vertical_rectangle);

        for(let i=0; i<this.peas.length; i++) {
            let ind = this.peas[i][0];
            let st = this.peas[i][1];
            let pos = this.grid_positions[ind];
            let dt = (t - st);
            let pea_center = [pos[0]+dt*2.5-8+0.2, pos[1]+1.13, pos[2]-4-0.1];
            let pea_top_left = [pea_center[0]-0.25, pea_center[1]+0.25, pea_center[2]+0.25];
            let pea_bot_right = [pea_center[0]+0.25, pea_center[1]-0.25, pea_center[2]-0.25];
            let pea_cords = [pea_top_left, pea_bot_right];
            let cen = this.grid_positions[22];
            let zombie_cords = [[cen[0]-0.5-8, cen[1]+2+0.05, cen[2]+1-4], [cen[0]+0.5-8, cen[1]+0.05, cen[2]-1-4]];

            // console.log("bullet: " + pea_cords);
            // console.log("zombie: " + zombie_cords);
            // console.log("pea_index: " + i);
            if(collision_detection(pea_cords, zombie_cords)){
                // console.log("here!");
                this.peas.splice(i, 1);
                i--;
            }else{
                if (dt < 8) {
                    this.render_pea(context, program_state, pos[0] + dt * 2.5 - 8, pos[1], pos[2] - 4);
                } else {
                    this.peas.splice(i, 1);
                    i--;
                }
            }


        }

        // Position the sun
        let model_transform = Mat4.identity()
            .times(Mat4.translation(10, 7, -2));
        this.shapes.sun.draw(context, program_state, model_transform, this.materials.sun);
        let headstone_transform = Mat4.identity()
            .times(Mat4.translation(10, 0, -2));
        this.shapes.headstone.draw(context, program_state, headstone_transform, this.materials.headstone);

        let peashooter = "pea";



        //0 - peashooter
        //1 - watermelon
        //2 - wallnut

        let normal_material = this.materials.buffer;
        let highlight_material = this.materials.buffer_highlight;
        let base_transform = Mat4.identity()
            .times(Mat4.translation(-13, 5, 1)) // Adjust the position in the scene
            .times(Mat4.rotation(Math.PI / 2, 0, 1, 0)) // Rotate to make it vertical
            .times(Mat4.scale(2, 2, 2)); // Scale to make it a small square

        // Draw four small squares lined up from left to right
        for (let i = 0; i < 10; i++) {
            let model_transform = base_transform
                .times(Mat4.translation(2, 0, 2 + i)) // Adjust spacing (2 units apart in this case)
                .times(Mat4.scale(0.5, 0.5, 0.5))
            // Choose the material based on this.pos
            let material = (this.buffer_index === i) ? highlight_material : normal_material;
            this.shapes.buffer.draw(context, program_state, model_transform, material);
        }

        for (let i=0; i<10; i++){
            let model_transform = base_transform
                .times(Mat4.translation(2, 0, 2 + i)) // Adjust spacing (2 units apart in this case)
                .times(Mat4.scale(0.5, 0.5, 0.5))
            if(this.buf_plants[i] === 1){

                this.shapes.text.set_string(peashooter, context.context);
                this.shapes.text.draw(context, program_state, model_transform
                    .times(Mat4.rotation(-1 * Math.PI / 2, 0, 1, 0))
                    .times(Mat4.translation(-0.5, 0, 1))
                    .times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
            }
        }



        // Position the clouds
        let cloud_transform = Mat4.identity()
            .times(Mat4.translation(0, 1.7, 1.2))
            .times(Mat4.translation(Math.sin(t), 6.5, -4)) // Floating up and down
            .times(Mat4.scale(2, 2, 2)); // Adjust scale as needed
        this.shapes.cloud.draw(context, program_state, cloud_transform, this.materials.cloud);

        let cloud_transform2 = Mat4.identity()
            .times(Mat4.translation(0, 0.2, 0.9))
            .times(Mat4.translation(-6+ Math.sin(t), 6.5 , -4)) // Floating up and down
            .times(Mat4.scale(2, 2, 2)); // Adjust scale as needed
        this.shapes.cloud.draw(context, program_state, cloud_transform2, this.materials.cloud);

        let cloud_transform3 = Mat4.identity()
            .times(Mat4.translation(0, 0.2, 0))
            .times(Mat4.translation(7+ Math.sin(t), 6.5, -4)) // Floating up and down
            .times(Mat4.scale(2, 2, 2)); // Adjust scale as needed
        this.shapes.cloud.draw(context, program_state, cloud_transform3, this.materials.cloud);

        // Position the sky background
        let sky_placement = Mat4.identity();
        sky_placement = sky_placement.times(Mat4.translation(80,0, -200)).times(Mat4.scale(400,400,400));
        this.shapes.sky.draw(context, program_state, sky_placement, this.materials.sky);

        // Position the ground
        let ground_placement = Mat4.identity();
        ground_placement = ground_placement
            .times(Mat4.translation(0,-10, 0))
            .times(Mat4.scale(80, 80, 80))
            .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
        this.shapes.ground.draw(context, program_state, ground_placement, this.materials.ground);

        //this.draw_menu_bar(context, program_state, model_transform, t / 1000);
        /*        // Draw the peashooters in the plant array
                for (const plant of this.plants) {
                    let plant_transform = Mat4.identity()
                        .times(Mat4.translation(plant[1] * 2 - 4, 0, plant[0] * 2 - 4));
                    this.shapes.peashooter.draw(context, program_state, plant_transform, this.materials.peashooter);
                }

                // Draw the selected peashooter at the current grid position
                if (this.starting) {
                    let selected_transform = Mat4.identity()
                        .times(Mat4.translation(this.grid_index[1] * 2 - 4, 0, this.grid_index[0] * 2 - 4))
                        .times(Mat4.scale(1.1, 1.1, 1.1));
                    this.shapes.peashooter.draw(context, program_state, selected_transform, this.materials.peashooter.override({color: hex_color("#FF0000")}));
                }

         */
    }
}


class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 gou_color;
        // ***** PHONG SHADING HAPPENS HERE: *****
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the
                // light will appear directional (uniform direction from all points), and we
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to
                // the point light's location from the current surface point.  In either case,
                // fade (attenuate) the light as the vector needed to reach it gets longer.
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz -
                                               light_positions_or_vectors[i].w * vertex_worldspace;
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );

                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;
            // Position is expressed in object coordinates.

            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;

            void main(){
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                gou_color = vec4( shape_color.xyz * ambient, shape_color.w);
                gou_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){
                // Compute an initial (ambient) color:
                gl_FragColor = gou_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        uniform vec4 ring_color;
        varying vec4 ring_position;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;

        void main(){
            gl_Position = projection_camera_model_transform*vec4(position, 1);
            ring_position = model_transform * vec4(position, 1);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        uniform mat4 model_transform;
        void main(){
            vec4 base_color = vec4(0.72, 0.55, 0.3, 1);
            vec4 origin_ring = model_transform * vec4(0,0,0,1);
            float scale = 0.5 + 0.5 * sin(length(ring_position.xyz - origin_ring.xyz) * 22.6);
            if (scale > 0.35){
            gl_FragColor = base_color*scale;
            }
            else {
            gl_FragColor = vec4(0,0,0,1);
            }
        }`;
    }
}

function collision_detection(bullet_cords, zombie_cords) {
    // console.log("bye");
    let top_left = [bullet_cords[1][0], bullet_cords[0][1], bullet_cords[0][2]];
    let top_right = [bullet_cords[1][0], bullet_cords[0][1], bullet_cords[1][2]];
    let bot_left = [bullet_cords[1][0], bullet_cords[1][1], bullet_cords[0][2]];
    let bot_right = bullet_cords[1];
    let rec = zombie_cords;
    let points = [top_left, top_right, bot_left, bot_right];
    // console.log("bullet: " + bullet_cords);
    // console.log("zombie: " + zombie_cords);
    console.log("bounding x " + rec[0][0] + " " + rec[1][0]);
    console.log("bounding y " + rec[0][1] + " " + rec[1][1]);
    console.log("bounding z " + rec[0][2] + " " + rec[1][2]);
    for(let i=0; i < points.length; i++) {
        let point = points[i];
        console.log("testing " + point);
        let temp1 = ((rec[0][0] <= point[0]) & (rec[1][0] >= point[0]));
        let temp2 = ((rec[0][1] >= point[1]) & (rec[1][1] <= point[1]));
        let temp3 = ((rec[0][2] >= point[2]) & (rec[1][2] <= point[2]));
        console.log([temp1, temp2, temp3]);
        if (temp1 && temp2 && temp3) {
            return true;
        }
    }
}



