const { nanoid } = require('nanoid');

exports.generateSlug = () => nanoid(6);