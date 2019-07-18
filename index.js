var fs = require("fs");
var NeuralNetConstructor = require('neuralnet');
var layers = require("./layers.json");

var X = 0;
var O = 1;
var NO = 0;
var YES = 1;
var _ = .5;
var ME = X;
var THEM = O;
var BLANK = _;
var PLAYER_1 = X;
var PLAYER_2 = O;
var MARKS = [BLANK, PLAYER_1, PLAYER_2];
var MARK_COUNT = MARKS.length; // player 1, player 2, empty
var CELL_COUNT = 9;
var MAX_COMBINATIONS = Math.pow(MARK_COUNT, CELL_COUNT) - 1;

var sequences = [
  // rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // diagonal
  [0, 4, 8],
  [2, 4, 6]
];

const decode = id => {
  const board = Number(id).toString(MARK_COUNT).split("").map(mark => MARKS[mark])
  // account for padding
  while (board.length < CELL_COUNT)
    board.unshift(BLANK);
  return board;
}

const encode = board =>
  parseInt(board.map(mark => MARKS.indexOf(mark)).join(""), MARK_COUNT);

const boards = [...Array(MAX_COMBINATIONS).keys()].map(decode)

const canPlay = board => isValid(board) && !gameEnded(board)

const sequenceCompletable = (board, mark) => ([c1,c2,c3]) =>
  (board[c1] === BLANK && board[c2] === mark && board[c3] === mark)||
  (board[c1] === mark && board[c2] === BLANK && board[c3] === mark)||
  (board[c1] === mark && board[c2] === mark && board[c3] === BLANK)

const hasWinnableSpot = board =>
  canPlay(board) ?
    sequences.some(sequenceCompletable(board, nextMark(board))) :
    false;

const canWinMultipleSequences = board =>
  hasWinnableSpot(board) &&
  sequences.filter(sequenceCompletable(board, nextMark(board))).length > 1;

const canWinMultipleSequencesAtOnce = board => {
  if(!canWinMultipleSequences(board)) return false;
  const move = newMove();
  sequences.forEach(moveToCompleteSequence(board, move, nextMark(board)));
  return move.some(isMoveBetter);
}

const moveToCompleteSequence = (board, move, mark) => ([c1,c2,c3]) => {
  if (board[c1] === BLANK && board[c2] === mark && board[c3] === mark) move[c1] += YES;
  if (board[c1] === mark && board[c2] === BLANK && board[c3] === mark) move[c2] += YES;
  if (board[c1] === mark && board[c2] === mark && board[c3] === BLANK) move[c3] += YES;
}

const newMove = () => Array(CELL_COUNT).fill(NO);

const getWinnableSpot = board => {
  const move = newMove();
  if (!hasWinnableSpot(board)) return move;
  sequences.forEach(moveToCompleteSequence(board, move, nextMark(board)));

  // if multiple winnable scenarios with same spot, choose most winnable
  while (move.some(isMoveBetter))
    move.forEach(demoteMove)

  return move;
}

const isMoveBetter = move => move > YES
const isMove = move => move > NO
const demoteMove = (move, index, moves) => moves[index] -= isMove(move) ? YES : 0;
const asTurn = board => CELL_COUNT - board.reduce(sumMarkFor(BLANK), 0) + 1;

const countMarks = board => [
  board.reduce(sumMarkFor(PLAYER_1), 0),
  board.reduce(sumMarkFor(PLAYER_2), 0)
]

const sumMarkFor = match => (sum, mark) => sum + (mark === match ? 1 : 0)
const nextMark = board => board.reduce(sumMarkFor(BLANK), 0) % 2 ? PLAYER_1 : PLAYER_2

const isValid = board => {
  const [p1,p2] = countMarks(board);
  return (p1 === p2 || p1 === p2 + 1) && !hasTwoWinners(board);
}

const hasTwoWinners = board => isWinnerPlayer1(board) && isWinnerPlayer2(board);
const wasJustCompleted = board => isValid(board) && !canPlay(board)
const hasWinner = board => wasJustCompleted(board) && (isWinnerPlayer1(board) || isWinnerPlayer2(board))
const isTie = board =>
  board.reduce(sumMarkFor(BLANK), 0) === 0 &&
  !isWinnerPlayer1(board) &&
  !isWinnerPlayer2(board)

const gameEnded = board =>
  isTie(board) ||
  isWinnerPlayer1(board) ||
  isWinnerPlayer2(board)

const isWinnerPlayer1 = board => isWinnerFor(PLAYER_1)(board);
const isWinnerPlayer2 = board => isWinnerFor(PLAYER_2)(board);

const isWinnerFor = mark => board => sequences.some(([c1,c2,c3]) =>
  board[c1] === mark &&
  board[c2] === mark &&
  board[c3] === mark
)

console.log("isValid", boards.filter(isValid).length);
console.log("canPlay", boards.filter(canPlay).length);
console.log("wasJustCompleted", boards.filter(wasJustCompleted).length);
console.log("isTie", boards.filter(isTie).length);
console.log("hasWinner", boards.filter(hasWinner).length);
console.log("isWinnerPlayer1", boards.filter(wasJustCompleted).filter(isWinnerPlayer1).length);
console.log("isWinnerPlayer2", boards.filter(wasJustCompleted).filter(isWinnerPlayer2).length);
console.log("hasWinnableSpot", boards.filter(hasWinnableSpot).length);
console.log("canWinMultipleSequences", boards.filter(canWinMultipleSequences).length);
console.log("canWinMultipleSequencesAtOnce", boards.filter(canWinMultipleSequencesAtOnce).length);
var config = {
  layers: layers,
  inputs: 9,
  outputs: 9
}

var neuralnet = NeuralNetConstructor(config)


var aboutToWin = boards.filter(hasWinnableSpot);
var expectedMoves = aboutToWin.map(getWinnableSpot);

if (true) {
  console.log("Training...");
  var MAX_TRAIN = 100;
  var lastPercent = 0;
  for(var i = 0; i < MAX_TRAIN; i++) {
    var curPercent = ((i / MAX_TRAIN) * 100).toFixed(1) + "%";
    if (curPercent !== lastPercent) {
      console.log(curPercent);
      lastPercent = curPercent;
    }

    for(var b = 0; b < aboutToWin.length; b++) {
      prediction = neuralnet.train(aboutToWin[b], expectedMoves[b])
    }
  }
  fs.writeFile("layers.json", JSON.stringify(neuralnet.layers, null, "  "), function(error) {
    if (error) console.log(error);
    console.log("layers persisted");
  });

  var count_GOOD = 0;

  for (var i = 0; i < aboutToWin.length; i++) {
    var input = aboutToWin[i];
    var prediction = neuralnet.predict(input);
    var expectation = expectedMoves[i];
    if (!prediction.some(function(value, index) {
      return expectation[index] === YES ? (value < .5) : (value >= .5);
    })) count_GOOD++;
    console.log("Board %s", i);
    console.log(displayResult(input, expectedMoves[i], prediction))
  }


  console.log("Good predictions %s out of %s (%s%)",
    count_GOOD,
    aboutToWin.length,
    ((count_GOOD/aboutToWin.length)*100).toFixed(2)
  )
}
function displayResult(board, expected, prediction) {

  var lines = [];
  var line_i = 0;
  var isBadPrediction = prediction.some(function(value, index) {
    return expected[index] === YES ? (value < .5) : (value >= .5);
  });

  for(var i = 0; i < 9; i++) {
    if (i === 0) {
      lines[line_i] = "";
    } else if (i % 3 === 0) {
      line_i++;
      lines[line_i] = "";
    } else if (i != 0) {
      lines[line_i] += "|";
    }

    if (expected[i] === YES) {
      lines[line_i] += "[";
    } else {
      lines[line_i] += " ";
    }
    var value = board[i];
    if (value === PLAYER_1) {
      lines[line_i] += "X";
    } else if (value === PLAYER_2) {
      lines[line_i] += "O";
    } else if (value === BLANK) {
      lines[line_i] += " ";
    }
    if (expected[i] === YES) {
      lines[line_i] += "]";
    } else {
      lines[line_i] += " ";
    }
  }

  line_i = -1;
  for(var i = 0; i < 9; i++) {
    if (i % 3 === 0) {
      line_i++;
      lines[line_i]+= "    ";
    } else if (i != 0) {
      lines[line_i] += "|";
    }

    var value = prediction[i];
    if (value < 0.001) {
      lines[line_i] += "     ";
    } else {
      var s = (value * 100).toFixed(2);
      while(s.length < 5) s = " " + s;
      lines[line_i] += s;
    }


  }
  var text = isBadPrediction ? "BAD PREDICTION!\n" : ""
  return text + lines.join("\n");
}
