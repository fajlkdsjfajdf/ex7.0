 (function() {
            // Create a style element
            const style = document.createElement('style');
            style.type = 'text/css';

            // Add CSS rules to the style element
            const css = `
                #toast {
                    visibility: hidden;
                    min-width: 250px;
                    margin-left: -125px;
                    background-color: #333;
                    color: #fff;
                    text-align: center;
                    border-radius: 2px;
                    padding: 16px;
                    position: fixed;
                    z-index: 1;
                    left: 50%;
                    top: 30px;
                    font-size: 17px;
                }

                #toast.show {
                    visibility: visible;
                    -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
                    animation: fadein 0.5s, fadeout 0.5s 2.5s;
                }

                @-webkit-keyframes fadein {
                    from {top: 0; opacity: 0;} 
                    to {top: 30px; opacity: 1;}
                }

                @keyframes fadein {
                    from {top: 0; opacity: 0;}
                    to {top: 30px; opacity: 1;}
                }

                @-webkit-keyframes fadeout {
                    from {top: 30px; opacity: 1;} 
                    to {top: 0; opacity: 0;}
                }

                @keyframes fadeout {
                    from {top: 30px; opacity: 1;}
                    to {top: 0; opacity: 0;}
                }
            `;

            // Append the CSS rules to the style element
            if (style.styleSheet) {
                style.styleSheet.cssText = css; // For IE support
            } else {
                style.appendChild(document.createTextNode(css));
            }

            // Append the style element to the head of the document
            document.head.appendChild(style);

            const toast_1 = document.createElement('div');
            toast_1.id = 'toast';
            document.body.appendChild(toast_1);

            // The rest of your JavaScript code goes here...
            let toast = document.getElementById("toast");
            let timer = null;
            let duration = 3000; // default duration in milliseconds

            function showToast(message) {
                clearTimeout(timer); // Clear any existing timers
                toast.innerHTML = message; // Set the message text
                toast.className = "show"; // Show the toast with animation
                timer = setTimeout(hideToast, duration); // Set a new timer to hide the toast after the specified duration
            }

            function hideToast() {
                toast.className = toast.className.replace("show", ""); // Remove the 'show' class to hide the toast with animation
            }

            window.toastr = {
                info: function(message, additionalDuration) {
                    if (additionalDuration) {
                        duration += additionalDuration; // Increase the duration by the additional time provided
                    } else {
                        duration = 3000; // Reset to default duration if no additional time is provided
                    }
                    showToast(message); // Show the toast with the updated message and duration
                }
            };
        })();