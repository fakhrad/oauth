const secret = 'lflekfmsldkjlaskfjlkfjalsjfdaslkdjfasnmnbhb';
module.exports = {
    secret : process.env.JWT_SECRET || secret
};