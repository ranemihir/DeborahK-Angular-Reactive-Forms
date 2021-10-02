import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormArray, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime } from "rxjs/operators";
import { Customer } from './customer';

function emailMatcher(c: AbstractControl): { [key: string]: boolean; } | null {
  const emailControl = c.get('email');
  const emailConfirmControl = c.get('confirmEmail');

  if (emailControl.pristine || emailConfirmControl.pristine) {
    return null;
  }

  if (emailControl.value === emailConfirmControl.value) {
    return null;
  }

  return { 'match': true };
}

function rangeValidator(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean; } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < 1 || c.value > 5)) {
      return { 'range': true };
    }

    return null;
  };
}


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();
  emailMessage: string = '';

  private valiationMessages = {
    email: 'Please enter a valid email address.',
    required: 'Please enter your email address.'
  };

  constructor(private fb: FormBuilder) { }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: ['', Validators.required],
      zip: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // this.customerForm = new FormGroup({
    //   firstName: new FormControl(),
    //   lastName: new FormControl(),
    //   email: new FormControl(),
    //   sendCatalog: new FormControl(true)
    // });

    // this.customerForm = this.fb.group({
    //   firstName: null,
    //   lastName: { value: '', disabled: false },
    //   email: null,
    //   sendCatalog: false
    // });

    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required]],
      }, {
        validator: emailMatcher
      }),
      phone: '',
      notification: 'email',
      rating: [null, rangeValidator(1, 5)],
      sendCatalog: false,
      addresses: this.fb.array([this.buildAddress()])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      this.setNotification(value);
    });

    const emailControl = this.customerForm.get('emailGroup.email');

    emailControl.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
      this.setMessage(emailControl);
    });
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Chandler',
      lastName: 'Bing',
      email: 'could.i.be.wearing.more.clothes@gmail.com',
      confirmEmial: 'could.i.be.wearing.more.clothes@gmail.com',
      sendCatalog: false
    });
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');

    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }

    phoneControl.updateValueAndValidity();
  }

  setMessage(c: AbstractControl) {
    this.emailMessage = '';

    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(key => this.valiationMessages[key]).join('\n');
    }
  }

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  save(): void { }
}
