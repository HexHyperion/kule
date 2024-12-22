import Game from "./Game";

export type Color = "black" | "white" | "red" | "lime" | "blue" | "orange" | "yellow";

interface BallInterface {
    color: Color;
    element: HTMLDivElement;
}

/**
 * @module Ball
 * The Ball class represents a ball in the game.
 */
export default class Ball implements BallInterface {
    /**
     * The color of the ball.
     * @type {Color}
     * @readonly
     */
    public color: Color;

    /**
     * The HTML element representing the ball.
     * @type {HTMLDivElement}
     * @readonly
     */
    public readonly element: HTMLDivElement;


    /**
     * Creates a new Ball instance.
     * @param {Color} [colorOverride] - Optional color to override the default random color
     */
    constructor(colorOverride?: Color) {
        // Create a new div element for the ball
        this.element = document.createElement("div") as HTMLDivElement;
        this.element.classList.add("ball");

        // Set the ball's color, either from the override or randomly from the game's colors
        this.color = colorOverride ?? Game.colors[Math.floor(Math.random() * Game.colors.length)];
        this.element.style.backgroundColor = this.color;
    }
}
