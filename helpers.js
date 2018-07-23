function ordinal(x) {
    // Convert x into an ordinal number
    
    switch(x) {
        case 1:
            return '1st';
        case 2:
            return '2nd';
        case 3:
            return '3rd';
        default:
            return x.toString() + 'th';
    }
}