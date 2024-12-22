import Game from "./Game";

// Ensure the DOM is fully loaded before initializing the game
document.addEventListener("DOMContentLoaded", () => {
    Game.createCells();
    Game.randomCells();
});