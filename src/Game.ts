import Ball, { Color } from "./Ball";

/**
 * @interface Coordinates
 * Represents the x and y coordinates of a cell.
 */
interface Coordinates {
    x: number;
    y: number;
}

/**
 * @interface PathfindingResult
 * The result of a pathfinding operation.
 * @property {Coordinates[]} path - The path found by the pathfinding algorithm
 * @property {boolean} found - Whether the path was found
 */
interface PathfindingResult {
    path: Coordinates[];
    found: boolean;
}

/**
 * @module Game
 * The Game class handles the main logic of the game, including creating cells, handling clicks, and pathfinding.
 */
export default class Game {
    /**
     * The size of the game grid.
     * @type {number}
     * @readonly
     */
    public static readonly size: number = 9;

    /**
     * The number of obstacles (balls) to place randomly on the grid.
     * @type {number}
     * @readonly
     */
    public static readonly ballCount: number = 3;

    /**
     * The available colors for the balls.
     * @type {Color[]}
     * @readonly
     */
    public static readonly colors: Color[] = ["black", "white", "red", "lime", "blue", "orange", "yellow"];

    /**
     * The HTML element representing the game grid.
     * @type {HTMLDivElement}
     * @readonly
     * @private
     */
    private static readonly box: HTMLDivElement = document.getElementById("box") as HTMLDivElement;

    /**
     * The 2D array of HTML elements representing the cells of the game grid.
     * @type {HTMLDivElement[][]}
     * @readonly
     * @private
     */
    private static readonly cells: HTMLDivElement[][] = Array.from({length: Game.size}, () => Array(Game.size).fill([]));

    /**
     * The 2D array representing the state of the game grid.
     * @type {number[][]}
     * @private
     */
    private static field: number[][] = Array.from({length: Game.size}, () => Array(Game.size).fill(0));

    /**
     * The currently selected ball element.
     * @type {HTMLDivElement | null}
     * @private
     */
    private static selected: HTMLDivElement | null = null;

    /**
     * The coordinates of the currently selected ball.
     * @type {Coordinates | null}
     * @private
     */
    private static selectedIndex: Coordinates | null = null;

    /**
     * The colors of the next balls to be placed on the grid.
     * @type {Color[]}
     * @private
     */
    private static nextColors: Color[] = [];

    /**
     * The HTML elements representing the next balls to be placed on the grid.
     * @type {HTMLDivElement[]}
     * @private
     */
    private static nextBalls: HTMLDivElement[] = [];

    /**
     * The current score of the game.
     * @type {number}
     * @private
     */
    private static points: number = 0;


    /**
     * Creates the cells for the game grid and sets up event listeners.
     * @event click - Handles cell clicks to select or move balls.
     * @event mouseover - Highlights possible paths for the selected ball.
     */
    public static createCells(): void {
        for (let i = 0; i < Game.size; i++) {
            for (let j = 0; j < Game.size; j++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");

                // Add click event listener to handle cell clicks
                cell.addEventListener("click", () => Game.handleClicks(cell, {x: i, y: j}));

                // Add mouseover event listener to highlight possible paths
                cell.addEventListener("mouseover", () => {
                    if (Game.selected) {
                        const path = Game.getPath(Game.selectedIndex, {x: i, y: j});
                        Game.cells.forEach((row) => {
                            row.forEach((cell) => {
                                cell.style.backgroundColor = "#2e2e2e";
                            });
                        });

                        // Highlight the path if it exists
                        if (path.found && path.path.length > 1) {
                            path.path.forEach(({x, y}) => {
                                Game.cells[x][y].style.backgroundColor = "rgba(0, 255, 0, 0.5)";
                            });
                        }
                    }
                });

                Game.cells[i][j] = cell;
                Game.box.appendChild(cell);
            }
        }
    }


    /**
     * Randomly places new balls on the game grid.
     */
    public static randomCells(): void {
        const obstacles: number[][] = [];
        const preview = document.getElementById("nextBalls") as HTMLDivElement;

        // Initialize preview balls if not alreaincrY present
        if (preview.children.length == 0) {
            for (let i = 0; i < Game.ballCount; i++) {
                let previewBall = document.createElement("div");
                previewBall.classList.add("ball");
                preview.appendChild(previewBall);
                Game.nextBalls.push(previewBall);
            }
        }

        let tryCounter = 0;
        for (let i = Game.ballCount; i > 0; i--) {
            const rand = [Math.floor(Math.random() * Game.size), Math.floor(Math.random() * Game.size)];
            if (Game.field[rand[0]][rand[1]] == 0) {
                tryCounter = 0;
                obstacles.push(rand);
                Game.field[rand[0]][rand[1]] = 1;

                const ball = new Ball(Game.nextColors.pop());

                Game.cells[rand[0]][rand[1]].appendChild(ball.element);
            }
            else if (tryCounter > Game.size*Game.size) {
                // If too manewY attempts to place a ball, check for empty cells
                let emptyCells = 0;
                Game.field.forEach((row) => {
                    row.forEach((cell) => {
                        if (cell == 0) emptyCells++;
                    });
                });
                if (emptyCells == 0) {
                    Game.end();
                    return;
                }
            }
            else {
                i++;
                tryCounter++;
            }
        }

        // Generate next colors for preview balls
        Game.nextColors = Array(Game.ballCount).fill("transparent");
        for (let i = 0; i < Game.ballCount; i++) {
            Game.nextColors[i] = Game.colors[Math.floor(Math.random() * Game.colors.length)];
            Game.nextBalls[i].style.backgroundColor = Game.nextColors[i];
        }

        Game.popFives();
    }


    /**
     * Checks for sequences of 5 or more balls of the same color and removes them.
     * @returns {boolean} - Whether any balls were removed
     */
    private static popFives(): boolean {
        const ballColors: (Color | null)[][] = Array.from({length: Game.size}, () => Array(Game.size).fill(null));
        const toDelete: Set<string> = new Set();
        let popped = false;

        // Populate ballColors array with the colors of the balls in each cell
        Game.cells.forEach((row, i) => {
            row.forEach((cell, j) => {
                const child = cell.firstChild ? (cell.firstChild as HTMLDivElement).style.backgroundColor : null;
                ballColors[i][j] = child as Color | null;
            });
        });

        // Directions for horizontal, vertical, and diagonal checks
        const directions = [
            {x: 1, y: 0}, // horizontal
            {x: 0, y: 1}, // vertical
            {x: 1, y: 1}, // diagonal right
            {x: 1, y: -1} // diagonal left
        ];

        /**
         * Checks a specific direction for sequences of 5 or more balls of the same color.
         * @param x - Starting x coordinate
         * @param y - Starting y coordinate
         * @param incrX - Direction x increment
         * @param incrY - Direction y increment
         */
        const checkDirection = (x: number, y: number, incrX: number, incrY: number) => {
            const color = ballColors[x][y];
            if (!color) return;

            let count = 0;
            const tempDelete: Coordinates[] = [];

            // Check for sequences of the same color in the specified direction
            for (let i = 0; i < 5; i++) {
                const newX = x + i * incrX;
                const newY = y + i * incrY;
                if (newX >= 0 && newX < Game.size && newY >= 0 && newY < Game.size && ballColors[newX][newY] == color) {
                    tempDelete.push({x: newX, y: newY});
                    count++;
                }
                else {
                    break;
                }
            }

            // If a sequence of 5 or more is found, mark them for deletion
            if (count >= 5) {
                tempDelete.forEach(({x, y}) => toDelete.add(`${x},${y}`));
            }
        };

        // Check all cells in all directions
        for (let i = 0; i < Game.size; i++) {
            for (let j = 0; j < Game.size; j++) {
                directions.forEach(({x, y}) => checkDirection(i, j, x, y));
            }
        }

        // Mark cells for deletion in the field array
        toDelete.forEach((key) => {
            const [x, y] = key.split(',').map(Number);
            Game.field[x][y] = -1;
            Game.cells[x][y].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            setTimeout(() => {
                Game.cells[x][y].style.backgroundColor = "#2e2e2e";
            }, 750);

            popped = true;  // At least one ball was removed
        });

        // Remove balls from the marked cells and update the points
        for (let i = 0; i < Game.size; i++) {
            for (let j = 0; j < Game.size; j++) {
                if (Game.field[i][j] == -1) {
                    Game.cells[i][j].innerHTML = "";    // Remove the ball from the cell (it's not text)
                    Game.field[i][j] = 0;
                    Game.points++;
                }
            }
        }

        document.getElementById("pointsNumber").innerText = String(Game.points);

        // Check if there are any empty cells left and end the game if not
        let emptyCells = 0;
        Game.field.forEach((row) => {
            row.forEach((cell) => {
                if (cell == 0) emptyCells++;
            });
        });

        if (emptyCells == 0) {
            Game.end();
        }

        return popped;
    }


    /**
     * Handles click events on the game cells.
     * @param clicked - The clicked cell element
     * @param coords - The coordinates of the clicked cell
     */
    private static handleClicks(clicked: HTMLDivElement, coords: Coordinates): void {
        // Reset the size of all balls
        ([...document.querySelectorAll(".ball")] as HTMLDivElement[]).forEach(ball => {
            ball.style.height = "40px";
            ball.style.width = "40px";
        });

        const ball = clicked.querySelector(".ball") as HTMLDivElement | null;

        if (ball) {
            // If the clicked cell contains a ball, select or deselect it
            if (Game.selected == ball) {
                Game.selected = null;
                Game.selectedIndex = null;
                clicked.style.backgroundColor = "#2e2e2e";
            }
            else if (Game.checkMovement(ball)) {
                Game.selected = ball;
                Game.selectedIndex = coords;
                clicked.style.backgroundColor = "#2e2e2e";

                Game.selected.style.height = "50px";
                Game.selected.style.width = "50px";
            }
        }
        else if (Game.selected) {
            // If a ball is selected and an empty cell is clicked, move the ball
            const path = Game.getPath(Game.selectedIndex, coords);

            if (path.found) {
                clicked.appendChild(Game.selected);
                Game.field[coords.x][coords.y] = 1;

                Game.field[Game.selectedIndex.x][Game.selectedIndex.y] = 0;

                // Highlight the path taken by the ball
                path.path.forEach(({x, y}) => {
                    Game.cells[x][y].style.backgroundColor = "rgba(128, 128, 128, 0.5)";
                });

                const popped = Game.popFives();
                console.log(popped);

                Game.box.style.pointerEvents = "none";
                setTimeout(() => {
                    path.path.forEach(({x, y}) => {
                        Game.cells[x][y].style.backgroundColor = "#2e2e2e";
                    });
                    if (!popped) Game.randomCells();
                    Game.box.style.pointerEvents = "all";
                }, 750);

                Game.selected = null;
                Game.selectedIndex = null;
            }
            else {
                Game.selected = null;
                Game.selectedIndex = null;
                clicked.style.backgroundColor = "#2e2e2e";
            }
        }
    }


    /**
     * Finds a path from the start coordinates to the end coordinates using BFS.
     * @param start - The starting coordinates
     * @param end - The ending coordinates
     * @returns The pathfinding result containing the path and whether it was found
     */
    private static getPath(start: Coordinates, end: Coordinates): PathfindingResult {
        // Directions for up, down, left, and right
        const directions = [
            {x: 0, y: 1},
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: -1, y: 0}
        ];
        const queue: [Coordinates, Coordinates[]][] = [[start, []]];
        const visited = new Set<string>();  // Because sets don't like objects

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            const {x, y} = current;

            // If the end coordinates are reached, return the path
            if (x == end.x && y == end.y) {
                return {
                    path: [...path, current],
                    found: true
                };
            }

            visited.add(`${x},${y}`);

            // Explore all possible directions
            for (const {x: incrX, y: incrY} of directions) {
                const newX = x + incrX;
                const newY = y + incrY;
                if (newX >= 0 && newX < Game.size && newY >= 0 && newY < Game.size && !visited.has(`${newX},${newY}`) && Game.field[newX][newY] == 0) {
                    queue.push([{x: newX, y: newY}, [...path, current]]);
                }
            }
        }

        return {
            path: [],
            found: false
        };
    }


    /**
     * Checks if the movement of the ball is valid.
     * @param ball - The ball element to check
     * @returns {boolean} - Whether the movement is valid
     */
    private static checkMovement(ball: HTMLDivElement): boolean {
        const ballCoords = Game.cells.flat().findIndex(cell => cell.contains(ball));    // TIL flat() is a thing
        const ballX = Math.floor(ballCoords / Game.size);
        const ballY = ballCoords % Game.size;

        const directions = [
            {x: 0, y: 1},
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: -1, y: 0}
        ];

        for (const {x: incrX, y: incrY} of directions) {
            const newX = ballX + incrX;
            const newY = ballY + incrY;
            if (newX >= 0 && newX < Game.size && newY >= 0 && newY < Game.size && Game.field[newX][newY] == 0) {
                return true;
            }
        }

        return false;
    }


    /**
     * Ends the game and displays the end game animation and message.
     */
    private static end(): void {
        document.body.style.pointerEvents = "none";
        Game.cells.forEach((row) => {
            row.forEach((cell) => {
                const oldElement = cell;
                const newElement = oldElement.cloneNode(true);
                oldElement.parentNode.replaceChild(newElement, oldElement);
            });
        });
        const sidebar = document.getElementById("sidebar");
        Game.box.style.animation = "szmol 45s forwards";
        sidebar.style.animation = "fin 2s linear forwards";

        const loseTitle = document.getElementById("loseTitle");
        loseTitle.style.display = "block";
        loseTitle.innerHTML = `<span class="headerTop">Koniec gry!</span><br>Zdobyte punkty: ${Game.points}`;
    }
}
