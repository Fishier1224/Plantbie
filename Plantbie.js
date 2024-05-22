import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import { Text_Line } from './examples/text-demo.js';
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Shader, Texture, Material, Scene,
} = tiny;

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

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            peashooter: new Shape_From_File("./assets/peashooter.obj"),
            square: new Square(),
            sun: new Shape_From_File("./assets/sphere.obj"),
            vertical_rectangle: new VerticalRectangle(),
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
            text: new Text_Line(35),
            //cloud: new Cloud(),
            //outlined_square: new Outlined_Square(),
        };

        const textured = new defs.Textured_Phong();

        // *** Materials
        this.materials = {
            // menu
            text_image: new Material(new defs.Textured_Phong(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                texture: new Texture("./assets/text.png")}),
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
            vertical_rectangle: new Material(textured, {
                color: hex_color("#87CEEB"),
                ambient: 1,
                diffusivity: 0.9,
                specularity: 1,
                texture: new Texture("assets/sky-gradient.jpg")
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
                color: hex_color("#000000")}),
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

        render_peashooter(context,program_state,x,y,z,t){
            let plant_transform = Mat4.identity().times(Mat4.translation(x,y,z),);
            plant_transform = plant_transform.times(Mat4.scale(0.35,0.35,0.35));
            const leaf_flex = Math.sin(2 * Math.PI * t) * 0.1; // Adjust frequency and amplitude as needed
            let leaf_transform = plant_transform.times(Mat4.translation(0,leaf_flex,0));
            this.shapes.peashooter_leaf.draw(context, program_state, leaf_transform, this.materials.peashooter);
            plant_transform = plant_transform.times(Mat4.translation(0, 1.5, -1));
            const neck_flex = Math.sin(2 * Math.PI * t) * 0.05; // Adjust frequency and amplitude as needed
            plant_transform = plant_transform.times(Mat4.rotation(neck_flex,1,0,0));
            this.shapes.peashooter_neck.draw(context, program_state, plant_transform, this.materials.peashooter);
            plant_transform = plant_transform.times(Mat4.translation(0, 2, 0));
            const head_bob = Math.sin(2*Math.PI * t) * 0.1; // Adjust frequency and amplitude as needed
            plant_transform = plant_transform.times(Mat4.translation(0, head_bob, 2*head_bob));
            this.shapes.peashooter_head.draw(context, program_state, plant_transform, this.materials.peashooter);
            plant_transform = plant_transform.times(Mat4.translation(-0.5, 0.25, -2.75));
            this.shapes.peashooter_hair.draw(context, program_state, plant_transform, this.materials.peashooter);
    }

    render_watermelon(context,program_state,x,y,z,t){
        let plant_transform = Mat4.identity().times(Mat4.translation(x,y,z),);
        plant_transform = plant_transform.times(Mat4.scale(0.45,0.4,0.4));
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

    render_scene(context, program_state, shadow_pass, draw_light_source = false, draw_shadow = false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow
        let model_transform = Mat4.identity();

        this.lifes = 1;
        const t = program_state.animation_time, dt = program_state.animation_delta_time / 1000;

        if (this.lifes != 0) {
            this.draw_menu_bar(context, program_state, model_transform, t / 1000);
        }
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

        this.key_triggered_button("Prev Plant", ["ArrowLeft"], () => this.buffer_index = Math.min(0, this.buffer_index-1));
        this.key_triggered_button("Prev Plant", ["ArrowRight"], () => this.buffer_index = Math.min(0, this.buffer_index+1));
        this.new_line();
        this.key_triggered_button("Plant", ["Enter"], () => this.grass_grid.set(this.grid_index, this.current_planet));// need to insert into array of plants;
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


    mouse_draw_obj(context, program_state) {
        // no button clicks? return
        if (this.userdraw == "none"){
            return;
        }
        // else, create object & push to item queue
        else {
            let obj_color = color(Math.random(), Math.random(), Math.random(), 1.0);
            let obj_scale = Math.random() * (3 - 1) + 1;
            let negorpos = 1 - 2 * Math.round(Math.random());
            let obj_rot = negorpos * Math.random() * (4 - 2) + 2;

            // since aquarium sphere is only so big --> set far z-axis to be closer/more forward
            let z_coord = 0.97;

            // if mouse click / object placement is on sand --> set far z-axis to more forward so object doesn't hide behind sand
            if (this.mousey < -0.5)
            {
                z_coord = 0.95;
            }

            let pos_ndc_near = vec4(this.mousex, this.mousey, -1.0, 1.0);
            let pos_ndc_far  = vec4(this.mousex, this.mousey, z_coord, 1.0);
            let center_ndc_near = vec4(0.0, 0.0, -1.0, 1.0);
            let P = program_state.projection_transform;
            let V = program_state.camera_inverse;
            let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
            let pos_world_far  = Mat4.inverse(P.times(V)).times(pos_ndc_far);
            let center_world_near  = Mat4.inverse(P.times(V)).times(center_ndc_near);
            pos_world_near.scale_by(1 / pos_world_near[3]);
            pos_world_far.scale_by(1 / pos_world_far[3]);
            center_world_near.scale_by(1 / center_world_near[3]);

            // create object
            let obj = {
                pos: pos_world_far,
                color: obj_color,
                size: obj_scale,
                negorpos: negorpos,
                object: this.userdraw
            }

            // if user clicked on nest --> update nest count & push position to queue
            // in order to hatch corresponding baby turtles at game over
            if (this.userdraw == "nest"){
                this.nest_count += 1;
                let transform = Mat4.translation(pos_world_far[0], pos_world_far[1], pos_world_far[2])
                                    .times(Mat4.scale(obj_scale, obj_scale, obj_scale, 0));
                this.nest_location.push(transform.times(Mat4.scale(0.6,0.6,0.6,0)));
            }

            this.userdraw = "none";

            // update sand dollars & total spent amount
            this.sand_dollars = this.sand_dollars - this.offset;
            this.total_spent = this.total_spent + this.offset;
            this.offset = 0;

            // push object to queue
            this.item_queue.push(obj);
        }
    }
    draw_menu_bar(context, program_state, model_transform, t){
        // draw menu platform at top of viewport (wood texture)
        let menubar_trans = model_transform.times(Mat4.translation(-26.4, 21, 0, 0))
                                                      .times(Mat4.scale(50, 2, 0, 0))
        this.shapes.square.draw(context, program_state, menubar_trans, this.materials.menu);

        // draw item 1: floral coral
        var item1_background_trans = model_transform.times(Mat4.translation(-23.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item1_trans = item1_background_trans.times(Mat4.translation(0.5, -0.25, 2, 0))
                                                .times(Mat4.scale(0.38, 0.38, 1, 0))
                                                .times(Mat4.rotation(-43.7, 0, 0, 1));
        this.shapes.coral1.draw(context, program_state, item1_trans, this.materials.coral.override({color:hex_color("#e691bc")}));

        let item1_price_trans = model_transform.times(Mat4.translation(-26.1, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price1 = 2;
        this.shapes.text.set_string("$"+ price1.toString(), context.context);
        this.shapes.text.draw(context, program_state, item1_price_trans, this.materials.text_image);

        // get position of item 1 button
        let button1x = ((item1_background_trans[0][3]) - (-5)) / 22.5;
        let button1y = (item1_background_trans[1][3] - (10.5)) / 12;

        // check if mouse click on item 1 button
        if ((this.mousex < button1x + 0.1 && this.mousex > button1x - 0.1) && (this.mousey < button1y + 0.12 && this.mousey > button1y - 0.1) && (this.sand_dollars - price1 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item1_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);

            // draw item on next mouse click
            this.userdraw = "coral1";
            this.offset = price1;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item1_background_trans, this.materials.menubuttons);
        }

        // draw item 2: rock
        let item2_background_trans = model_transform.times(Mat4.translation(-18.3, 20.8, 0, 0))
                                        .times(Mat4.scale(1.4, 1.4, .5, 0))

        let item2_trans = item2_background_trans.times(Mat4.translation(0.3, -0.25, 2, 0))
                                                .times(Mat4.scale(0.65, 0.65, 1, 0));
        this.shapes.rock.draw(context, program_state, item2_trans, this.materials.rock);

        let item2_price_trans = model_transform.times(Mat4.translation(-21, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price2 = 1;
        this.shapes.text.set_string("$"+ price2.toString(), context.context);
        this.shapes.text.draw(context, program_state, item2_price_trans, this.materials.text_image);


        // get position of item 2 button
        let button2x = ((item2_background_trans[0][3]) - (-5)) / 22.5;
        let button2y = (item2_background_trans[1][3] - (10.5)) / 12;

        // check if item 2 button is clicked
        if ((this.mousex < button2x + 0.1 && this.mousex > button2x - 0.1) && (this.mousey < button2y + 0.12 && this.mousey > button2y - 0.1) && (this.sand_dollars - price2 >= 0))
        {
            var new_money = this.sand_dollars - price2;
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item2_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "rock";
            this.offset = price2;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item2_background_trans, this.materials.menubuttons);
        }


        // draw item 3: spiky coral
        let item3_background_trans = model_transform.times(Mat4.translation(-13, 20.8, 0, 0))
                                                        .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item3_trans = item3_background_trans.times(Mat4.translation(0.2, -0.25, 2, 0))
                                                    .times(Mat4.scale(0.5, 0.47, 1, 0));
        this.shapes.coral2.draw(context, program_state, item3_trans, this.materials.coral.override({color: hex_color("#f59f49")}));

        let item3_price_trans = model_transform.times(Mat4.translation(-16, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price3 = 3;
        this.shapes.text.set_string("$"+ price3.toString(), context.context);
        this.shapes.text.draw(context, program_state, item3_price_trans, this.materials.text_image);

        // get position of item 3 button
        let button3x = ((item3_background_trans[0][3]) - (-5)) / 22.5;
        let button3y = (item3_background_trans[1][3] - (10.5)) / 12;

        // check if item 3 button is clicked
        if ((this.mousex < button3x + 0.1 && this.mousex > button3x - 0.1) && (this.mousey < button3y + 0.12 && this.mousey > button3y - 0.1) && (this.sand_dollars - price3 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item3_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "coral2";
            this.offset = price3;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item3_background_trans, this.materials.menubuttons);
        }

        // draw item 4: golden squid
        let item4_background_trans = model_transform.times(Mat4.translation(-6.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item4_trans = item4_background_trans.times(Mat4.translation(0.1, -0.25, 2, 0))
                                                .times(Mat4.scale(.7, .33, 1, 0))
        this.shapes.squid.draw(context, program_state, item4_trans, this.materials.gold);

        let item4_price_trans = model_transform.times(Mat4.translation(-10.8, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price4 = 15;
        this.shapes.text.set_string("$"+ price4.toString(), context.context);
        this.shapes.text.draw(context, program_state, item4_price_trans, this.materials.text_image);


        // get position of item 4 button
        let button4x = ((item4_background_trans[0][3]) - (-5)) / 22.5;
        let button4y = (item4_background_trans[1][3] - (10.5)) / 12;

        // check if item 4 button is clicked
        if ((this.mousex < button4x + 0.1 && this.mousex > button4x - 0.1) && (this.mousey < button4y + 0.12 && this.mousey > button4y - 0.1) && (this.sand_dollars - price4 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item4_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "squid";
            this.offset = price4;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item4_background_trans, this.materials.menubuttons);
        }

        // draw item 5: starfish
        let item5_background_trans = model_transform.times(Mat4.translation(-1.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item5_trans = item5_background_trans.times(Mat4.translation(-0.1, -0.25, 2, 0))
                                                .times(Mat4.scale(.5, .5, 1, 0))
        this.shapes.starfish.draw(context, program_state, item5_trans, this.materials.coral.override({color: hex_color("#ff892e")}));

        let item5_price_trans = model_transform.times(Mat4.translation(-4.7, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price5 = 5;
        this.shapes.text.set_string("$"+ price5.toString(), context.context);
        this.shapes.text.draw(context, program_state, item5_price_trans, this.materials.text_image);

        // get position of item 5 button
        let button5x = ((item5_background_trans[0][3]) - (-5)) / 22.5;
        let button5y = (item5_background_trans[1][3] - (10.5)) / 12;

        // check if item 5 button is clicked
        if ((this.mousex < button5x + 0.1 && this.mousex > button5x - 0.1) && (this.mousey < button5y + 0.12 && this.mousey > button5y - 0.1) && (this.sand_dollars - price5 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item5_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "starfish";
            this.offset = price5;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item5_background_trans, this.materials.menubuttons);
        }
        // draw item 6: seashell
        let item6_background_trans = model_transform.times(Mat4.translation(4, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item6_trans = item6_background_trans.times(Mat4.translation(0.2, -0.25, 2, 0))
                                                .times(Mat4.scale(.4, .4, 1, 0))
        this.shapes.seashell.draw(context, program_state, item6_trans, this.materials.coral.override({color: hex_color("#f5988e")}));

        let item6_price_trans = model_transform.times(Mat4.translation(0.3, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price6 = 4;
        this.shapes.text.set_string("$"+ price6.toString(), context.context);
        this.shapes.text.draw(context, program_state, item6_price_trans, this.materials.text_image);

        // get position of item 6 button
        let button6x = ((item6_background_trans[0][3]) - (-5)) / 22.5;
        let button6y = (item6_background_trans[1][3] - (10.5)) / 12;

        // check if item 6 button is clicked
        if ((this.mousex < button6x + 0.1 && this.mousex > button6x - 0.1) && (this.mousey < button6y + 0.12 && this.mousey > button6y - 0.1) && (this.sand_dollars - price6 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item6_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "shell";
            this.offset = price6;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item6_background_trans, this.materials.menubuttons);
        }

        // draw item 7: jellyfish
        let item7_background_trans = model_transform.times(Mat4.translation(9.2, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item7_trans = item7_background_trans.times(Mat4.translation(-.35, -0.4, 2, 0))
                                                .times(Mat4.scale(.4, .35, 1, 0))
                                                .times(Mat4.rotation(-33, 1, 0, 0))
                                                .times(Mat4.rotation(-66, 0, 1, 0));
        this.shapes.jellyfish.draw(context, program_state, item7_trans, this.materials.coral.override({color: hex_color("#6ee7f0")}));

        let item7_price_trans = model_transform.times(Mat4.translation(5.7, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price7 = 7;
        this.shapes.text.set_string("$"+ price7.toString(), context.context);
        this.shapes.text.draw(context, program_state, item7_price_trans, this.materials.text_image);

        // get position of item 7 button
        let button7x = ((item7_background_trans[0][3]) - (-5)) / 22.5;
        let button7y = (item7_background_trans[1][3] - (10.5)) / 12;

        // check if item 7 button is clicked
        if ((this.mousex < button7x + 0.1 && this.mousex > button7x - 0.1) && (this.mousey < button7y + 0.12 && this.mousey > button7y - 0.1) && (this.sand_dollars - price7 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item7_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click_scale
            this.userdraw = "jellyfish";
            this.offset = price7;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item7_background_trans, this.materials.menubuttons);
        }

        // draw item 8: nest
        let item8_background_trans = model_transform.times(Mat4.translation(15.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item8_trans = item8_background_trans.times(Mat4.translation(-.35, -0.1, 2, 0))
                                                .times(Mat4.scale(0.6, 0.6, 0.6, 0));
        this.shapes.nest.draw(context, program_state, item8_trans, this.materials.coral.override({color:hex_color("#7a5038")}));

        let egg1 = item8_trans.times(Mat4.scale(0.45,0.75,0.6,0))
                            .times(Mat4.translation(-0.8,0.2,0,0));
        this.shapes.sphere.draw(context, program_state, egg1, this.materials.egg);
        let egg2 = item8_trans.times(Mat4.scale(0.4,0.7,0.6,0))
                            .times(Mat4.translation(-1.5,0,-0.5,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg2, this.materials.egg);
        let egg3 = item8_trans.times(Mat4.scale(0.4,0.78,0.6,0))
                            .times(Mat4.translation(0,0,-0.6,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg3, this.materials.egg);
        let egg4 = item8_trans.times(Mat4.scale(0.5,0.4,0.6,0))
                            .times(Mat4.translation(1,0.7,1,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg4, this.materials.egg);

        let item8_price_trans = model_transform.times(Mat4.translation(10.5, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price8 = 12;
        this.shapes.text.set_string("$"+ price8.toString(), context.context);
        this.shapes.text.draw(context, program_state, item8_price_trans, this.materials.text_image);

        // get position of item 8 button
        let button8x = ((item8_background_trans[0][3]) - (-5)) / 22.5;
        let button8y = (item8_background_trans[1][3] - (10.5)) / 12;

        // check if item 8 button is clicked
        if ((this.mousex < button8x + 0.1 && this.mousex > button8x - 0.1) && (this.mousey < button8y + 0.12 && this.mousey > button8y - 0.1) && (this.sand_dollars - price8 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08;
            let animate_click_transform = item8_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click
            this.userdraw = "nest";
            this.offset = price8;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item8_background_trans, this.materials.menubuttons);
        }

        // draw money count
        let dash_model = Mat4.identity().times(Mat4.translation(11.2,16.8,4,0)).times(Mat4.scale(1.3,1.3,0.2,5));
        let point_string = this.sand_dollars;
        this.shapes.text.set_string(point_string.toString(), context.context);
        this.shapes.square.draw(context, program_state, dash_model.times(Mat4.scale(.50, .50, .50)), this.materials.sanddollar);
        dash_model = dash_model.times(Mat4.translation(1,-0.09,0));
        this.shapes.text.draw(context, program_state, dash_model.times(Mat4.scale(.50, .50, .50)), this.materials.text_image);


        // draw lifes count
        let lifes_model = Mat4.identity().times(Mat4.translation(-21.5,16,4,0)).times(Mat4.scale(1.2,1.2,0.2,5));
        let lifes_string = this.lifes;
        this.shapes.text.set_string("lives:", context.context);
        this.shapes.square.draw(context, program_state, lifes_model.times(Mat4.scale(2, 2, .50)), this.materials.livestext);
        for (var i = 0; i < this.lifes; i++){
            if (i == 0){
                var heart_model = lifes_model.times(Mat4.translation(2.7, 0.55, 0));
            }
            else{
                var heart_model = lifes_model.times(Mat4.translation(i*1.5+2.7, 0.55, 0));
            }
            this.shapes.square.draw(context, program_state, heart_model.times(Mat4.scale(0.7, 0.7, 1)), this.materials.heart);
        }

    }
    plant_peashooter() {
        // add a new peashooter at the current grid index if not already present
        const position = [...this.grid_index];
        if (!this.plants.some(plant => plant[0] === position[0] && plant[1] === position[1])) {
            this.plants.push(position);
        }
    }

    remove_peashooter() {
        // remove peashooter at the current grid index if present
        this.plants = this.plants.filter(plant => plant[0] !== this.grid_index[0] || plant[1] !== this.grid_index[1]);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        const t = program_state.animation_time / 1000;
            const time_in_sec = t;
            const time_loading_screen = 0;
            const time_loading_screen_end = 9;
            this.game_sound.play();
            //let loading_transform = Mat4.identity().times(Mat4.translation(-7.5,13,11,0)).times(Mat4.scale(1.2,1.2,0.2,5));
            //this.shapes.text.set_string("loading...", context.context);
            //this.shapes.text.draw(context, program_state, loading_transform.times(Mat4.scale(.35, .35, .50)), this.materials.text_image);
            /*if (time_in_sec > time_loading_screen && time_in_sec < time_loading_screen_end) {
                let model_transform = Mat4.identity();
                this.loading_sound.play();
                console.log("hi")
                this.shapes.square.draw(context, program_state, model_transform.times(Mat4.translation(-5,9,10,0)).times(Mat4.scale(15, 10, 1)),this.materials.square);

                    let loading_transform = Mat4.identity().times(Mat4.translation(-7.5,13,11,0)).times(Mat4.scale(1.2,1.2,0.2,5));
                    this.shapes.text.set_string("loading...", context.context);
                    this.shapes.text.draw(context, program_state, loading_transform.times(Mat4.scale(.35, .35, .50)), this.materials.text_image);

                    let max_angle = .1 * Math.PI;

                    const time_in_sec = t/1000;
                    const time_fish1 = 3;

                    if (time_in_sec > time_fish1) {
                        let fish1_trans = model_transform.times(Mat4.translation(-15, 10, 11))
                                                  .times(Mat4.scale(0.8,0.6,0.5,1));
                        this.shapes.peashooter.draw(context, program_state, fish1_trans, this.materials.peashooter);
                    }

                    const time_fish2 = 4;

                    if (time_in_sec > time_fish2) {
                        let fish2_trans = model_transform.times(Mat4.translation(-10, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));
                        this.shapes.peashooter.draw(context, program_state, fish2_trans, this.materials.peashooter);
                    }

                    const time_fish3 = 5;

                    if (time_in_sec > time_fish3) {

                        let fish3_trans = model_transform.times(Mat4.translation(-5, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));
                        this.shapes.peashooter.draw(context, program_state, fish3_trans, this.materials.peashooter);
                    }

                    const time_fish4 = 6;

                    if (time_in_sec > time_fish4) {

                        let fish4_trans = model_transform.times(Mat4.translation(0, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));
                        this.shapes.peashooter.draw(context, program_state, fish4_trans, this.materials.peashooter);
                    }

                    const time_fish5 = 7;

                    if (time_in_sec > time_fish5) {
                        let fish5_trans = model_transform.times(Mat4.translation(5.0, 10, 11))
                                                     .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.peashooter.draw(context, program_state, fish5_trans, this.materials.peashooter);
                    }
                } // end of loading screen
        */
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

        //const t = program_state.animation_time / 1000;

        // Define the light for the scene
        const light_position = vec4(0, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let plant_transform = Mat4.identity()
                .times(Mat4.translation(0, 1, 0));
        // this.shapes.peashooter.draw(context, program_state, plant_transform, this.materials.peashooter);

        this.render_peashooter(context,program_state,0,0.05,0,t);
        this.render_watermelon(context,program_state,-2,0.05,-2,t);

        const ind = this.grid_index[0] * 9 + this.grid_index[1];
        for (let i=0; i<this.grid_positions.length; i++) {
            const pos = this.grid_positions[i]// Draw each square in the grid
            let square_transform = Mat4.identity()
                .times(Mat4.translation(pos[0] - 8, pos[1], pos[2] - 4))
                .times(Mat4.scale(1.36, 1.36, 1.36));

            // Draw the inner square
            if(i === ind){
                this.materials.square.color = this.select_color;
                this.shapes.square.draw(context, program_state, square_transform, this.materials.square.override({color:hex_color("FFFF00")}));
                this.materials.square.color = this.normal_color;
                console.log(i);
                console.log("ni"+ind);
            }
            else{
                this.shapes.square.draw(context, program_state, square_transform, this.materials.square.override({color:hex_color("006400")}));
            }

            // Draw the outline
            let outline_transform = square_transform.times(Mat4.scale(1.3, 1.3, 1.3)); // Slightly larger for outline
            this.shapes.square.draw(context, program_state, outline_transform, this.materials.outlined_square);
        }

        // Position the sun
        let model_transform = Mat4.identity()
                .times(Mat4.translation(10, 7, -2));
        this.shapes.sun.draw(context, program_state, model_transform, this.materials.sun);
        let headstone_transform = Mat4.identity()
                .times(Mat4.translation(10, 0, -2));
        this.shapes.headstone.draw(context, program_state, headstone_transform, this.materials.headstone);


        //const model_transform_vertical = model_transform.times(Mat4.rotation(Math.PI / 2, 1, 0, 0)).times(Mat4.translation(0, 0, -0.25)); // Adjust translation as needed
        // let model_transform2 = Mat4.identity()
        //     .times(Mat4.translation(0, 5, -5))
        //     .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
        //     .times(Mat4.scale(10, 10, 20));
        // this.shapes.vertical_rectangle.draw(context, program_state, model_transform2, this.materials.vertical_rectangle);

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
